import type { Env, LineMessage } from "./types";

export async function replyMessages(
  env: Env,
  replyToken: string,
  messages: LineMessage[]
): Promise<void> {
  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ replyToken, messages })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("LINE reply failed", response.status, detail);
  }
}
