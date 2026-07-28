import { fallbackNarrative } from "./fortune";
import type { Env, FortuneResult } from "./types";

const FORBIDDEN = [
  /必ず勝/,
  /勝てる/,
  /高設定/,
  /設定[1-6]/,
  /取り返/,
  /追加投資/,
  /借金/,
  /確実/,
  /保証/
];

export async function createNarrative(
  env: Env,
  fortune: Omit<FortuneResult, "narrative">
): Promise<string> {
  if (!env.GEMINI_API_KEY) return fallbackNarrative(fortune);

  const model = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const prompt = [
    "以下の確定済み占いデータだけを材料に、日本語で100〜170文字の鑑定文を1段落で作成してください。",
    "条件:",
    "- 点数・数字・色・アイテムを変更しない",
    "- 読んだだけで意味が完結する",
    "- 勝利、高設定、出玉、回収、追加投資を断定・推奨しない",
    "- 不安や負けを煽らない",
    "- 占い・娯楽として、落ち着いたが少し期待感のある文体",
    `データ: ${JSON.stringify({
      overall: fortune.overall,
      rank: fortune.rank,
      draw: fortune.draw,
      selection: fortune.selection,
      flow: fortune.flow,
      calmness: fortune.calmness,
      luckyDigit: fortune.luckyDigit,
      luckyColor: fortune.luckyColor,
      luckyItem: fortune.luckyItem,
      machineStyle: fortune.machineStyle,
      theme: fortune.theme
    })}`
  ].join("\n");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "あなたはスロット題材の娯楽占いサービス『ヒキヨミ』の文章編集者です。事実の予測ではなく、確定済みデータを短く自然な鑑定文へ整形します。"
            }
          ]
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 240 }
      })
    });

    if (!response.ok) return fallbackNarrative(fortune);
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text || text.length < 60 || text.length > 260) return fallbackNarrative(fortune);
    if (FORBIDDEN.some((pattern) => pattern.test(text))) return fallbackNarrative(fortune);
    return text.replace(/^「|」$/g, "");
  } catch {
    return fallbackNarrative(fortune);
  }
}
