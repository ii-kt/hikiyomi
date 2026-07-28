import { verifyLineSignature } from "./crypto";
import {
  isAdultBirthDate,
  isValidTime,
  normalizeBirthDateText,
  normalizeBirthTimeText,
  todayJst
} from "./date";
import { createV2Narrative } from "./gemini";
import { privacyHtml, termsHtml } from "./legal";
import { replyMessages } from "./line";
import {
  birthDateMessage,
  birthTimeMessage,
  fortuneMessage,
  registeredMessage,
  simpleText
} from "./messages";
import { getRegistrationStep, isBirthTimeUnknownText } from "./registration";
import {
  claimWebhookEvent,
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({ service: "hikiyomi", status: "ok" });
    }
    if (request.method === "GET" && url.pathname === "/privacy") {
      return new Response(privacyHtml(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (request.method === "GET" && url.pathname === "/terms") {
      return new Response(termsHtml(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (request.method !== "POST" || url.pathname !== "/webhook") {
      return new Response("Not Found", { status: 404 });
    }

    const body = await request.text();
    const signature = request.headers.get("x-line-signature") ?? "";
    const valid = await verifyLineSignature(body, signature, env.LINE_CHANNEL_SECRET);
    if (!valid) return new Response("Invalid signature", { status: 401 });

    let payload: LineWebhookBody;
    try {
      payload = JSON.parse(body) as LineWebhookBody;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const events = payload.events ?? [];
    ctx.waitUntil(Promise.all(events.map((event) => handleEvent(event, env))));
    return new Response("OK");
  }
};

async function handleEvent(event: LineWebhookEvent, env: Env): Promise<void> {
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
    await replyMessages(env, replyToken, [registrationMessage(user)]);
    return;
  }

  if (event.type === "postback") {
    await handlePostback(event, env, userId, replyToken);
    return;
  }

  if (event.type === "message" && event.message?.type === "text") {
    await handleText(event.message.text ?? "", env, userId, replyToken);
  }
}

async function handlePostback(
  event: LineWebhookEvent,
  env: Env,
  userId: string,
  replyToken: string
): Promise<void> {
  const params = new URLSearchParams(event.postback?.data ?? "");
  const action = params.get("action");

  if (action === "set_birthdate") {
    const birthDate = event.postback?.params?.date;
    if (!birthDate || !isAdultBirthDate(birthDate)) {
      await replyMessages(env, replyToken, [simpleText("ヒキヨミは18歳以上向けです。生年月日を確認してください。")]);
      return;
    }
    await setBirthDate(env.DB, userId, birthDate);
    await replyMessages(env, replyToken, [birthTimeMessage()]);
    return;
  }

  if (action === "set_birthtime") {
    const birthTime = event.postback?.params?.time;
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) {
      await replyMessages(env, replyToken, [birthDateMessage()]);
      return;
    }
    if (!birthTime || !isValidTime(birthTime)) {
      await replyMessages(env, replyToken, [simpleText("出生時刻を確認できませんでした。時刻を選び直してください。")]);
      return;
    }
    await setBirthTime(env.DB, userId, birthTime);
    await replyMessages(env, replyToken, [registeredMessage()]);
    return;
  }

  if (action === "birthtime_unknown") {
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) {
      await replyMessages(env, replyToken, [birthDateMessage()]);
      return;
    }
    await setBirthTimeUnknown(env.DB, userId);
    await replyMessages(env, replyToken, [registeredMessage()]);
    return;
  }

  if (action === "fortune") {
    await sendFortune(env, userId, replyToken);
    return;
  }

  await replyMessages(env, replyToken, [simpleText("操作を確認できませんでした。『今日のスロ運』と送ってください。")]);
}

async function handleText(
  text: string,
  env: Env,
  userId: string,
  replyToken: string
): Promise<void> {
  const normalized = text.trim();
  const birthDate = normalizeBirthDateText(normalized);
  if (birthDate) {
    if (!isAdultBirthDate(birthDate)) {
      await replyMessages(env, replyToken, [simpleText("ヒキヨミは18歳以上向けです。生年月日を確認してください。")]);
      return;
    }
    await setBirthDate(env.DB, userId, birthDate);
    await replyMessages(env, replyToken, [birthTimeMessage()]);
    return;
  }

  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) === "birth-time") {
    if (isBirthTimeUnknownText(normalized)) {
      await setBirthTimeUnknown(env.DB, userId);
      await replyMessages(env, replyToken, [registeredMessage()]);
      return;
    }

    const birthTime = normalizeBirthTimeText(normalized);
    if (birthTime) {
      await setBirthTime(env.DB, userId, birthTime);
      await replyMessages(env, replyToken, [registeredMessage()]);
      return;
    }
  }

  if (/^(今日の)?(スロ運|占い|運勢)|占って/.test(normalized)) {
    await sendFortune(env, userId, replyToken);
    return;
  }

  await replyMessages(env, replyToken, [registrationMessage(user)]);
}

async function sendFortune(env: Env, userId: string, replyToken: string): Promise<void> {
  const user = await getUser(env.DB, userId);
  const step = getRegistrationStep(user);
  if (step !== "complete" || !user?.birth_date) {
    await replyMessages(env, replyToken, [registrationMessage(user)]);
    return;
  }

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

  await replyMessages(env, replyToken, [fortuneMessage(fortune)]);
}

function registrationMessage(user: UserRecord | null): LineMessage {
  const step = getRegistrationStep(user);
  if (step === "birth-date") return birthDateMessage();
  if (step === "birth-time") return birthTimeMessage();
  return registeredMessage();
}
