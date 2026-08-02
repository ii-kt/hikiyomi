import { verifyLineSignature } from "./crypto";
import {
  isAdultBirthDate,
  isValidTime,
  normalizeBirthDateText,
  normalizeBirthTimeText,
  todayJst
} from "./date";
import { fortuneMessages, reasonMessage } from "./fortune-messages";
import { fortuneModeMessage } from "./fortune-mode-message";
import { createV2Narrative } from "./gemini";
import { helpHtml, homeHtml, privacyHtml, termsHtml } from "./legal";
import { replyMessages } from "./line";
import {
  birthDateMessage,
  birthTimeMessage,
  dataDeletedMessage,
  deleteConfirmationMessage,
  helpMessage,
  registeredMessage,
  settingsMessage,
  simpleText,
  unknownMessage
} from "./messages";
import { getRegistrationStep, isBirthTimeUnknownText } from "./registration";
import {
  claimWebhookEvent,
  deleteUserData,
  ensureUser,
  getFortune,
  getUser,
  markUserInactive,
  saveFortune,
  setBirthDate,
  setBirthTime,
  setBirthTimeUnknown
} from "./storage";
import type {
  Env,
  FortuneReadingMode,
  FortuneResult,
  LineMessage,
  LineWebhookBody,
  LineWebhookEvent,
  UserRecord
} from "./types";
import {
  createV2Fortune,
  V2_ENGINE_VERSION
} from "./v2/fortune";
import { buildFoundationAssessment } from "./v2/rules";
import { foundationInputFromUser } from "./v2/user-input";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const baseUrl = url.origin;

    if (request.method === "GET" && url.pathname === "/") {
      return html(homeHtml(baseUrl));
    }
    if (request.method === "GET" && url.pathname === "/help") {
      return html(helpHtml(baseUrl));
    }
    if (request.method === "GET" && url.pathname === "/privacy") {
      return html(privacyHtml());
    }
    if (request.method === "GET" && url.pathname === "/terms") {
      return html(termsHtml());
    }
    if (request.method !== "POST" || url.pathname !== "/webhook") {
      return new Response("Not Found", { status: 404 });
    }

    const body = await request.text();
    const signature = request.headers.get("x-line-signature") ?? "";
    const valid = await verifyLineSignature(
      body,
      signature,
      env.LINE_CHANNEL_SECRET
    );
    if (!valid) return new Response("Invalid signature", { status: 401 });

    let payload: LineWebhookBody;
    try {
      payload = JSON.parse(body) as LineWebhookBody;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const events = payload.events ?? [];
    ctx.waitUntil(
      Promise.all(events.map((event) => handleEvent(event, env, baseUrl)))
    );
    return new Response("OK");
  }
};

async function handleEvent(
  event: LineWebhookEvent,
  env: Env,
  baseUrl: string
): Promise<void> {
  const userId = event.source?.userId;
  if (!userId) return;

  if (!(await claimWebhookEvent(env.DB, event.webhookEventId))) return;

  if (event.type === "unfollow") {
    await markUserInactive(env.DB, userId);
    return;
  }

  const replyToken = event.replyToken;
  if (!replyToken) return;

  await ensureUser(env.DB, userId);

  if (event.type === "follow") {
    const user = await getUser(env.DB, userId);
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]);
    return;
  }

  if (event.type === "postback") {
    await handlePostback(event, env, userId, replyToken, baseUrl);
    return;
  }

  if (event.type === "message" && event.message?.type === "text") {
    await handleText(
      event.message.text ?? "",
      env,
      userId,
      replyToken,
      baseUrl
    );
  }
}

async function handlePostback(
  event: LineWebhookEvent,
  env: Env,
  userId: string,
  replyToken: string,
  baseUrl: string
): Promise<void> {
  const params = new URLSearchParams(event.postback?.data ?? "");
  const action = params.get("action");

  if (action === "start_registration" || action === "edit_birthdate") {
    await replyMessages(env, replyToken, [
      birthDateMessage(baseUrl, action === "edit_birthdate")
    ]);
    return;
  }

  if (action === "set_birthdate") {
    const birthDate = event.postback?.params?.date;
    if (!birthDate || !isAdultBirthDate(birthDate)) {
      await replyMessages(env, replyToken, [
        simpleText(
          "ヒキヨミは18歳以上向けです。生年月日を確認してください。"
        )
      ]);
      return;
    }
    await setBirthDate(env.DB, userId, birthDate);
    await replyMessages(env, replyToken, [birthTimeMessage(baseUrl)]);
    return;
  }

  if (action === "edit_birthtime") {
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) {
      await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]);
      return;
    }
    await replyMessages(env, replyToken, [birthTimeMessage(baseUrl, true)]);
    return;
  }

  if (action === "set_birthtime") {
    const birthTime = event.postback?.params?.time;
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) {
      await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]);
      return;
    }
    if (!birthTime || !isValidTime(birthTime)) {
      await replyMessages(env, replyToken, [
        simpleText(
          "出生時刻を確認できませんでした。時刻を選び直してください。"
        )
      ]);
      return;
    }
    await setBirthTime(env.DB, userId, birthTime);
    await replyMessages(env, replyToken, [registeredMessage(baseUrl)]);
    return;
  }

  if (action === "birthtime_unknown") {
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) {
      await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]);
      return;
    }
    await setBirthTimeUnknown(env.DB, userId);
    await replyMessages(env, replyToken, [registeredMessage(baseUrl)]);
    return;
  }

  if (action === "fortune") {
    await sendFortuneMode(env, userId, replyToken, baseUrl);
    return;
  }

  if (action === "fortune_quick") {
    await sendFortune(env, userId, replyToken, baseUrl, "quick");
    return;
  }

  if (action === "fortune_deep") {
    await sendFortune(env, userId, replyToken, baseUrl, "deep");
    return;
  }

  if (action === "reason") {
    await sendReason(env, userId, replyToken, baseUrl);
    return;
  }

  if (action === "settings") {
    const user = await getUser(env.DB, userId);
    if (getRegistrationStep(user) !== "complete" || !user) {
      await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]);
      return;
    }
    await replyMessages(env, replyToken, [settingsMessage(user, baseUrl)]);
    return;
  }

  if (action === "help") {
    await replyMessages(env, replyToken, [helpMessage(baseUrl)]);
    return;
  }

  if (action === "delete_confirm") {
    await replyMessages(env, replyToken, [deleteConfirmationMessage()]);
    return;
  }

  if (action === "delete_account") {
    await deleteUserData(env.DB, userId);
    await replyMessages(env, replyToken, [dataDeletedMessage(baseUrl)]);
    return;
  }

  await replyMessages(env, replyToken, [unknownMessage()]);
}

async function handleText(
  text: string,
  env: Env,
  userId: string,
  replyToken: string,
  baseUrl: string
): Promise<void> {
  const normalized = text.trim();
  const birthDate = normalizeBirthDateText(normalized);
  if (birthDate) {
    if (!isAdultBirthDate(birthDate)) {
      await replyMessages(env, replyToken, [
        simpleText(
          "ヒキヨミは18歳以上向けです。生年月日を確認してください。"
        )
      ]);
      return;
    }
    await setBirthDate(env.DB, userId, birthDate);
    await replyMessages(env, replyToken, [birthTimeMessage(baseUrl)]);
    return;
  }

  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) === "birth-time") {
    if (isBirthTimeUnknownText(normalized)) {
      await setBirthTimeUnknown(env.DB, userId);
      await replyMessages(env, replyToken, [registeredMessage(baseUrl)]);
      return;
    }

    const birthTime = normalizeBirthTimeText(normalized);
    if (birthTime) {
      await setBirthTime(env.DB, userId, birthTime);
      await replyMessages(env, replyToken, [registeredMessage(baseUrl)]);
      return;
    }
  }

  if (/^(サク読み|簡単に|かんたんに)$/.test(normalized)) {
    await sendFortune(env, userId, replyToken, baseUrl, "quick");
    return;
  }

  if (/^(ガチ読み|ちゃんと見る|詳しく|くわしく)$/.test(normalized)) {
    await sendFortune(env, userId, replyToken, baseUrl, "deep");
    return;
  }

  if (/^(今日の)?(スロ運|占い|運勢)$|占って/.test(normalized)) {
    await sendFortuneMode(env, userId, replyToken, baseUrl);
    return;
  }

  if (/^(登録情報|設定|プロフィール)$/.test(normalized)) {
    if (getRegistrationStep(user) !== "complete" || !user) {
      await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]);
    } else {
      await replyMessages(env, replyToken, [settingsMessage(user, baseUrl)]);
    }
    return;
  }

  if (/^(使い方|ヘルプ|help)$/i.test(normalized)) {
    await replyMessages(env, replyToken, [helpMessage(baseUrl)]);
    return;
  }

  if (/^(根拠|理由|鑑定の根拠)$/.test(normalized)) {
    await sendReason(env, userId, replyToken, baseUrl);
    return;
  }

  if (/^(生年月日変更|生年月日を変更)$/.test(normalized)) {
    await replyMessages(env, replyToken, [birthDateMessage(baseUrl, true)]);
    return;
  }

  if (/^(出生時刻変更|出生時刻を変更)$/.test(normalized)) {
    if (!user?.birth_date) {
      await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]);
    } else {
      await replyMessages(env, replyToken, [birthTimeMessage(baseUrl, true)]);
    }
    return;
  }

  if (getRegistrationStep(user) !== "complete") {
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]);
    return;
  }

  await replyMessages(env, replyToken, [unknownMessage()]);
}

async function sendFortuneMode(
  env: Env,
  userId: string,
  replyToken: string,
  baseUrl: string
): Promise<void> {
  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) !== "complete" || !user?.birth_date) {
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]);
    return;
  }

  const birthTimeKnown = user.birth_time_known === 1 && Boolean(user.birth_time);
  await replyMessages(env, replyToken, [fortuneModeMessage(birthTimeKnown)]);
}

async function sendFortune(
  env: Env,
  userId: string,
  replyToken: string,
  baseUrl: string,
  mode: FortuneReadingMode
): Promise<void> {
  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) !== "complete" || !user?.birth_date) {
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]);
    return;
  }

  const fortune = await getOrCreateTodayFortune(env, userId, user);
  await replyMessages(env, replyToken, fortuneMessages(fortune, baseUrl, mode));
}

async function sendReason(
  env: Env,
  userId: string,
  replyToken: string,
  baseUrl: string
): Promise<void> {
  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) !== "complete" || !user?.birth_date) {
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]);
    return;
  }

  const fortune = await getOrCreateTodayFortune(env, userId, user);
  await replyMessages(env, replyToken, [reasonMessage(fortune, baseUrl)]);
}

async function getOrCreateTodayFortune(
  env: Env,
  userId: string,
  user: UserRecord
): Promise<FortuneResult> {
  const date = todayJst();
  let fortune = await getFortune(env.DB, userId, date);

  if (
    !fortune ||
    fortune.engineVersion !== V2_ENGINE_VERSION ||
    !fortune.analysis
  ) {
    const assessment = await buildFoundationAssessment(
      foundationInputFromUser({
        user,
        userId,
        targetDate: date,
        salt: env.FORTUNE_SALT
      })
    );
    const draft = createV2Fortune(assessment);
    const narrative = await createV2Narrative(env, draft);
    const candidate: FortuneResult = { ...draft, narrative };
    await saveFortune(env.DB, userId, candidate);
    fortune = (await getFortune(env.DB, userId, date)) ?? candidate;
  }

  return fortune;
}

function registrationMessage(
  user: UserRecord | null,
  baseUrl: string
): LineMessage {
  const step = getRegistrationStep(user);
  if (step === "birth-date") return birthDateMessage(baseUrl);
  if (step === "birth-time") return birthTimeMessage(baseUrl);
  return registeredMessage(baseUrl);
}

function html(content: string): Response {
  return new Response(content, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}
