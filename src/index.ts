import { verifyLineSignature } from "./crypto";
import {
  isAdultBirthDate,
  isValidTime,
  normalizeBirthDateText,
  normalizeBirthTimeText,
  todayJst
} from "./date";
import { birthLocationMessage, normalizeBirthLocationText } from "./birth-location";
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
  setBirthTimeUnknown,
  setLocationInputMode,
  setPlayLocation,
  setPlayPeriod
} from "./storage";
import { setBirthLocation } from "./storage-location";
import type {
  Env,
  FortuneReadingMode,
  FortuneResult,
  LineMessage,
  LineWebhookBody,
  LineWebhookEvent,
  UserRecord
} from "./types";
import { createV2Fortune, V2_ENGINE_VERSION } from "./v2/fortune";
import { buildFoundationAssessment } from "./v2/rules";
import { foundationInputFromUser } from "./v2/user-input";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const baseUrl = url.origin;
    if (request.method === "GET" && url.pathname === "/") return html(homeHtml(baseUrl));
    if (request.method === "GET" && url.pathname === "/help") return html(helpHtml(baseUrl));
    if (request.method === "GET" && url.pathname === "/privacy") return html(privacyHtml());
    if (request.method === "GET" && url.pathname === "/terms") return html(termsHtml());
    if (request.method !== "POST" || url.pathname !== "/webhook") return new Response("Not Found", { status: 404 });

    const body = await request.text();
    const signature = request.headers.get("x-line-signature") ?? "";
    if (!(await verifyLineSignature(body, signature, env.LINE_CHANNEL_SECRET))) {
      return new Response("Invalid signature", { status: 401 });
    }

    let payload: LineWebhookBody;
    try { payload = JSON.parse(body) as LineWebhookBody; }
    catch { return new Response("Invalid JSON", { status: 400 }); }

    ctx.waitUntil(Promise.all((payload.events ?? []).map((event) => handleEvent(event, env, baseUrl))));
    return new Response("OK");
  }
};

async function handleEvent(event: LineWebhookEvent, env: Env, baseUrl: string): Promise<void> {
  const userId = event.source?.userId;
  if (!userId || !(await claimWebhookEvent(env.DB, event.webhookEventId))) return;
  if (event.type === "unfollow") { await markUserInactive(env.DB, userId); return; }
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
    await handleText(event.message.text ?? "", env, userId, replyToken, baseUrl);
  }
}

async function handlePostback(event: LineWebhookEvent, env: Env, userId: string, replyToken: string, baseUrl: string): Promise<void> {
  const params = new URLSearchParams(event.postback?.data ?? "");
  const action = params.get("action");

  if (action !== "edit_birthlocation" && action !== "edit_playlocation") {
    await setLocationInputMode(env.DB, userId, null);
  }

  if (action === "start_registration" || action === "edit_birthdate") {
    await replyMessages(env, replyToken, [birthDateMessage(baseUrl, action === "edit_birthdate")]); return;
  }
  if (action === "set_birthdate") {
    const birthDate = event.postback?.params?.date;
    if (!birthDate || !isAdultBirthDate(birthDate)) {
      await replyMessages(env, replyToken, [simpleText("ヒキヨミは18歳以上向けです。生年月日を確認してください。")] ); return;
    }
    await setBirthDate(env.DB, userId, birthDate);
    await replyMessages(env, replyToken, [birthTimeMessage(baseUrl)]); return;
  }
  if (action === "edit_birthtime") {
    const user = await getUser(env.DB, userId);
    await replyMessages(env, replyToken, [user?.birth_date ? birthTimeMessage(baseUrl, true) : birthDateMessage(baseUrl)]); return;
  }
  if (action === "set_birthtime") {
    const birthTime = event.postback?.params?.time;
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) { await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]); return; }
    if (!birthTime || !isValidTime(birthTime)) {
      await replyMessages(env, replyToken, [simpleText("出生時刻を確認できませんでした。時刻を選び直してください。")] ); return;
    }
    await setBirthTime(env.DB, userId, birthTime);
    await replyMessages(env, replyToken, [registeredMessage(baseUrl)]); return;
  }
  if (action === "birthtime_unknown") {
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) { await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]); return; }
    await setBirthTimeUnknown(env.DB, userId);
    await replyMessages(env, replyToken, [registeredMessage(baseUrl)]); return;
  }
  if (action === "edit_birthlocation") {
    const user = await getUser(env.DB, userId);
    if (!user?.birth_date) { await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]); return; }
    await setLocationInputMode(env.DB, userId, "awaiting_birth_location");
    await replyMessages(env, replyToken, [birthLocationMessage()]); return;
  }
  if (action === "edit_playlocation") {
    await setLocationInputMode(env.DB, userId, "awaiting_play_location");
    await replyMessages(env, replyToken, [simpleText("今日打つ市区町村名をそのまま送ってください。例：○○市\n未設定に戻す場合は「未定」と送ってください。")]); return;
  }
  if (action === "edit_playperiod") {
    await replyMessages(env, replyToken, [playPeriodMessage()]); return;
  }
  if (action === "set_playperiod") {
    const period = normalizePlayPeriod(params.get("value"));
    await setPlayPeriod(env.DB, userId, period);
    const user = await getUser(env.DB, userId);
    await replyMessages(env, replyToken, user ? [fortuneModeMessage(user)] : [unknownMessage()]); return;
  }
  if (action === "fortune") { await sendFortuneMode(env, userId, replyToken, baseUrl); return; }
  if (action === "fortune_quick") { await sendFortune(env, userId, replyToken, baseUrl, "quick"); return; }
  if (action === "fortune_deep") { await sendFortune(env, userId, replyToken, baseUrl, "deep"); return; }
  if (action === "reason") { await sendReason(env, userId, replyToken, baseUrl); return; }
  if (action === "settings") {
    const user = await getUser(env.DB, userId);
    await replyMessages(env, replyToken, [getRegistrationStep(user) === "complete" && user ? settingsMessage(user, baseUrl) : registrationMessage(user, baseUrl)]); return;
  }
  if (action === "help") { await replyMessages(env, replyToken, [helpMessage(baseUrl)]); return; }
  if (action === "delete_confirm") { await replyMessages(env, replyToken, [deleteConfirmationMessage()]); return; }
  if (action === "delete_account") {
    await deleteUserData(env.DB, userId);
    await replyMessages(env, replyToken, [dataDeletedMessage(baseUrl)]); return;
  }
  await replyMessages(env, replyToken, [unknownMessage()]);
}

async function handleText(text: string, env: Env, userId: string, replyToken: string, baseUrl: string): Promise<void> {
  const normalized = text.trim();
  const birthDate = normalizeBirthDateText(normalized);
  if (birthDate) {
    if (!isAdultBirthDate(birthDate)) {
      await replyMessages(env, replyToken, [simpleText("ヒキヨミは18歳以上向けです。生年月日を確認してください。")] ); return;
    }
    await setBirthDate(env.DB, userId, birthDate);
    await replyMessages(env, replyToken, [birthTimeMessage(baseUrl)]); return;
  }

  const user = await getUser(env.DB, userId);

  if (user?.status === "awaiting_birth_location") {
    const birthLocation = normalizeBirthLocationText(normalized);
    if (!birthLocation) {
      await replyMessages(env, replyToken, [simpleText("市区町村名をそのまま送ってください。例：○○市")]); return;
    }
    await setBirthLocation(env.DB, userId, birthLocation);
    await setLocationInputMode(env.DB, userId, null);
    const updated = await getUser(env.DB, userId);
    await replyMessages(env, replyToken, [
      simpleText(`出生地を「${birthLocation}」で登録しました。`),
      ...(updated ? [settingsMessage(updated, baseUrl)] : [])
    ]);
    return;
  }

  if (user?.status === "awaiting_play_location") {
    const playLocation = /^(未定|未設定|なし|削除)$/.test(normalized)
      ? null
      : normalizeBirthLocationText(normalized);
    if (playLocation === null && !/^(未定|未設定|なし|削除)$/.test(normalized)) {
      await replyMessages(env, replyToken, [simpleText("市区町村名をそのまま送ってください。例：○○市")]); return;
    }
    await setPlayLocation(env.DB, userId, playLocation);
    const updated = await getUser(env.DB, userId);
    await replyMessages(env, replyToken, updated ? [fortuneModeMessage(updated)] : [unknownMessage()]);
    return;
  }

  if (getRegistrationStep(user) === "birth-time") {
    if (isBirthTimeUnknownText(normalized)) {
      await setBirthTimeUnknown(env.DB, userId);
      await replyMessages(env, replyToken, [registeredMessage(baseUrl)]); return;
    }
    const birthTime = normalizeBirthTimeText(normalized);
    if (birthTime) {
      await setBirthTime(env.DB, userId, birthTime);
      await replyMessages(env, replyToken, [registeredMessage(baseUrl)]); return;
    }
  }

  if (/^(サク読み|簡単に|かんたんに)$/.test(normalized)) { await sendFortune(env, userId, replyToken, baseUrl, "quick"); return; }
  if (/^(ガチ読み|ちゃんと見る|詳しく|くわしく)$/.test(normalized)) { await sendFortune(env, userId, replyToken, baseUrl, "deep"); return; }
  if (/^(今日の)?(スロ運|占い|運勢)$|占って/.test(normalized)) { await sendFortuneMode(env, userId, replyToken, baseUrl); return; }
  if (/^(登録情報|設定|プロフィール)$/.test(normalized)) {
    await replyMessages(env, replyToken, [getRegistrationStep(user) === "complete" && user ? settingsMessage(user, baseUrl) : registrationMessage(user, baseUrl)]); return;
  }
  if (/^(使い方|ヘルプ|help)$/i.test(normalized)) { await replyMessages(env, replyToken, [helpMessage(baseUrl)]); return; }
  if (/^(根拠|理由|鑑定の根拠)$/.test(normalized)) { await sendReason(env, userId, replyToken, baseUrl); return; }
  if (/^(生年月日変更|生年月日を変更)$/.test(normalized)) { await replyMessages(env, replyToken, [birthDateMessage(baseUrl, true)]); return; }
  if (/^(出生時刻変更|出生時刻を変更)$/.test(normalized)) {
    await replyMessages(env, replyToken, [user?.birth_date ? birthTimeMessage(baseUrl, true) : birthDateMessage(baseUrl)]); return;
  }
  if (/^(出生地変更|出生地を変更|出生地を追加)$/.test(normalized)) {
    if (!user?.birth_date) { await replyMessages(env, replyToken, [birthDateMessage(baseUrl)]); return; }
    await setLocationInputMode(env.DB, userId, "awaiting_birth_location");
    await replyMessages(env, replyToken, [birthLocationMessage()]); return;
  }
  if (/^(今日打つ地域|遊技地域|地域を設定)$/.test(normalized)) {
    await setLocationInputMode(env.DB, userId, "awaiting_play_location");
    await replyMessages(env, replyToken, [simpleText("今日打つ市区町村名をそのまま送ってください。例：○○市")]); return;
  }
  if (/^(遊技予定|予定時間|時間を設定)$/.test(normalized)) {
    await replyMessages(env, replyToken, [playPeriodMessage()]); return;
  }
  if (getRegistrationStep(user) !== "complete") { await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]); return; }
  await replyMessages(env, replyToken, [unknownMessage()]);
}

async function sendFortuneMode(env: Env, userId: string, replyToken: string, baseUrl: string): Promise<void> {
  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) !== "complete" || !user?.birth_date) {
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]); return;
  }
  await replyMessages(env, replyToken, [fortuneModeMessage(user)]);
}

async function sendFortune(env: Env, userId: string, replyToken: string, baseUrl: string, mode: FortuneReadingMode): Promise<void> {
  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) !== "complete" || !user?.birth_date) {
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]); return;
  }
  const fortune = personalizeFortune(await getOrCreateTodayFortune(env, userId, user), user);
  await replyMessages(env, replyToken, fortuneMessages(fortune, baseUrl, mode));
}

async function sendReason(env: Env, userId: string, replyToken: string, baseUrl: string): Promise<void> {
  const user = await getUser(env.DB, userId);
  if (getRegistrationStep(user) !== "complete" || !user?.birth_date) {
    await replyMessages(env, replyToken, [registrationMessage(user, baseUrl)]); return;
  }
  const fortune = personalizeFortune(await getOrCreateTodayFortune(env, userId, user), user);
  await replyMessages(env, replyToken, [reasonMessage(fortune, baseUrl)]);
}

async function getOrCreateTodayFortune(env: Env, userId: string, user: UserRecord): Promise<FortuneResult> {
  const date = todayJst();
  let fortune = await getFortune(env.DB, userId, date);
  if (!fortune || fortune.engineVersion !== V2_ENGINE_VERSION || !fortune.analysis) {
    const assessment = await buildFoundationAssessment(foundationInputFromUser({ user, userId, targetDate: date, salt: env.FORTUNE_SALT }));
    const draft = createV2Fortune(assessment);
    const narrative = await createV2Narrative(env, draft);
    const candidate: FortuneResult = { ...draft, narrative };
    await saveFortune(env.DB, userId, candidate);
    fortune = (await getFortune(env.DB, userId, date)) ?? candidate;
  }
  return fortune;
}

function personalizeFortune(fortune: FortuneResult, user: UserRecord): FortuneResult {
  const context: string[] = [];
  if (user.play_location) context.push(`今日打つ地域は${user.play_location}です。`);
  if (user.play_period) {
    context.push(`遊技予定は${user.play_period}です。基準のラッキータイムは${fortune.luckyTime}なので、予定時間内では焦らず相性要素が重なる場面を優先してください。`);
  }
  if (context.length === 0) return fortune;
  const slotSummary = [fortune.analysis?.slotSummary, ...context].filter(Boolean).join("\n");
  return {
    ...fortune,
    narrative: `${fortune.narrative}\n${context.join(" ")}`,
    analysis: fortune.analysis ? { ...fortune.analysis, slotSummary } : fortune.analysis
  };
}

function normalizePlayPeriod(value: string | null): string | null {
  if (!value || value === "undecided") return null;
  const labels: Record<string, string> = {
    morning: "朝イチ",
    daytime: "昼から",
    evening: "夕方から",
    night: "夜から"
  };
  return labels[value] ?? null;
}

function playPeriodMessage(): LineMessage {
  const items = [
    ["朝イチ", "morning"],
    ["昼から", "daytime"],
    ["夕方から", "evening"],
    ["夜から", "night"],
    ["未定", "undecided"]
  ];
  return {
    type: "text",
    text: "今日の遊技予定を選んでください。総合点は変えず、時間帯の説明に反映します。",
    quickReply: {
      items: items.map(([label, value]) => ({
        type: "action",
        action: { type: "postback", label, data: `action=set_playperiod&value=${value}`, displayText: label }
      }))
    }
  };
}

function registrationMessage(user: UserRecord | null, baseUrl: string): LineMessage {
  const step = getRegistrationStep(user);
  if (step === "birth-date") return birthDateMessage(baseUrl);
  if (step === "birth-time") return birthTimeMessage(baseUrl);
  return registeredMessage(baseUrl);
}

function html(content: string): Response {
  return new Response(content, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}
