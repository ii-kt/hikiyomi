import { verifyLineSignature } from "./crypto";
import { isAdultBirthDate, normalizeBirthDateText, todayJst } from "./date";
import { createFortune } from "./fortune";
import { createNarrative } from "./gemini";
import { privacyHtml, termsHtml } from "./legal";
import { replyMessages } from "./line";
import {
  ageConfirmationMessage,
  birthDateMessage,
  fortuneMessage,
  registeredMessage,
  simpleText
} from "./messages";
import {
  claimWebhookEvent,
  ensureUser,
  getFortune,
  getUser,
  markUserInactive,
  saveFortune,
  setAdultConfirmed,
  setBirthDate
} from "./storage";
import type { Env, FortuneResult, LineWebhookBody, LineWebhookEvent } from "./types";

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
    await replyMessages(env, replyToken, [ageConfirmationMessage()]);
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

  if (action === "adult_no") {
    await replyMessages(env, replyToken, [
      simpleText("ヒキヨミは18歳以上向けのため利用できません。18歳になってからご利用ください。")
    ]);
    return;
  }

  if (action === "adult_yes") {
    await setAdultConfirmed(env.DB, userId);
    await replyMessages(env, replyToken, [birthDateMessage()]);
    return;
  }

  if (action === "set_birthdate") {
    const birthDate = event.postback?.params?.date;
    if (!birthDate || !isAdultBirthDate(birthDate)) {
      await replyMessages(env, replyToken, [simpleText("18歳以上であることを確認できる生年月日を選択してください。")]);
      return;
    }
    await setBirthDate(env.DB, userId, birthDate);
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
    await replyMessages(env, replyToken, [registeredMessage()]);
    return;
  }

  if (/^(今日の)?(スロ運|占い|運勢)|占って/.test(normalized)) {
    await sendFortune(env, userId, replyToken);
    return;
  }

  const user = await getUser(env.DB, userId);
  if (!user?.adult_confirmed) {
    await replyMessages(env, replyToken, [ageConfirmationMessage()]);
  } else if (!user.birth_date) {
    await replyMessages(env, replyToken, [birthDateMessage()]);
  } else {
    await replyMessages(env, replyToken, [
      simpleText("『今日のスロ運』と送ると、本日の占いを表示します。")
    ]);
  }
}

async function sendFortune(env: Env, userId: string, replyToken: string): Promise<void> {
  const user = await getUser(env.DB, userId);
  if (!user?.adult_confirmed) {
    await replyMessages(env, replyToken, [ageConfirmationMessage()]);
    return;
  }
  if (!user.birth_date) {
    await replyMessages(env, replyToken, [birthDateMessage()]);
    return;
  }

  const date = todayJst();
  let fortune = await getFortune(env.DB, userId, date);
  if (!fortune) {
    const core = await createFortune({
      userId,
      birthDate: user.birth_date,
      date,
      salt: env.FORTUNE_SALT
    });
    const narrative = await createNarrative(env, core);
    const candidate: FortuneResult = { ...core, narrative };
    await saveFortune(env.DB, userId, candidate);
    fortune = (await getFortune(env.DB, userId, date)) ?? candidate;
  }

  await replyMessages(env, replyToken, [fortuneMessage(fortune)]);
}
