import type { Env } from "./types";
import {
  fallbackV2Narrative,
  type V2FortuneDraft
} from "./v2/fortune";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 4_500;

const KNOWN_MANUFACTURERS = [
  "サミー",
  "大都技研",
  "SANKYO",
  "山佐ネクスト",
  "北電子",
  "ユニバーサルエンターテインメント",
  "平和",
  "藤商事",
  "ニューギン",
  "コナミアミューズメント"
] as const;

const FORBIDDEN = [
  /必ず勝/,
  /勝てる/,
  /高設定/,
  /設定[1-6]/,
  /設定状況/,
  /当たりやす/,
  /勝率/,
  /期待値が高/,
  /取り返/,
  /追加投資/,
  /投資を増/,
  /追うべき/,
  /借金/,
  /確実/,
  /勝利.{0,8}保証/,
  /結果を保証(?:する|します|できる|される)/,
  /(?:推奨|おすすめ|オススメ|提携|協賛|公認|公式認定|パートナー|スポンサー)/
];

export async function createV2Narrative(
  env: Env,
  fortune: V2FortuneDraft
): Promise<string> {
  const fallback = fallbackV2Narrative(fortune);
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return fallback;

  // 個人情報と非表示の内部指標は含めず、利用者へ表示する確定結果だけを送る。
  const anonymousData = {
    engineVersion: fortune.engineVersion,
    overall: fortune.overall,
    rank: fortune.rank,
    draw: fortune.draw,
    compatibility: {
      machineStyle: fortune.machineStyle,
      manufacturers: fortune.compatibleManufacturers
    },
    lucky: {
      digit: fortune.luckyDigit,
      numbers: fortune.luckyNumbers,
      color: fortune.luckyColor,
      item: fortune.luckyItem,
      time: fortune.luckyTime
    },
    guidance: {
      theme: fortune.theme,
      caution: fortune.caution
    },
    reasoning: {
      confidence: fortune.analysis.confidence,
      consensus: fortune.analysis.consensus,
      mainFactors: fortune.analysis.mainFactors,
      conflicts: fortune.analysis.conflicts,
      sourceRuleIds: fortune.analysis.sourceRuleIds
    }
  };

  return requestNarrative(
    env,
    apiKey,
    anonymousData,
    fortune.compatibleManufacturers,
    fallback
  );
}

async function requestNarrative(
  env: Env,
  apiKey: string,
  data: Record<string, unknown>,
  allowedManufacturers: readonly string[],
  fallback: string
): Promise<string> {
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const prompt = [
    "以下の確定済み占いデータだけを材料に、日本語で110〜190文字の鑑定文を1段落で作成してください。",
    "条件:",
    "- 総合点、引き運、数字、色、アイテム、時刻、機種タイプ、メーカー名を変更しない",
    "- 立ち回りテーマと注意ポイントを、実際に使い方が分かるように自然に含める",
    "- 非表示の能力や状態を推測しない。冷静さ、判断力、技量を測定した表現をしない",
    "- データにない占術、天体、出来事、店舗、機種名を追加しない",
    "- メーカー名を設定状況、勝率、推奨、提携の意味で扱わない",
    "- 勝利、高設定、出玉、回収、追加投資を断定または推奨しない",
    "- 不安、損失、焦りを煽らない",
    "- 占い・娯楽として、落ち着いたが少し期待感のある文体",
    `確定データ: ${JSON.stringify(data)}`
  ].join("\n");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "あなたはスロットを題材にした娯楽占いサービス『ヒキヨミ』の文章編集者です。計算、能力評価、実機予測はせず、渡された確定データを読みやすい鑑定文へ整形します。"
            }
          ]
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 320,
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              narrative: {
                type: "string",
                description:
                  "110〜190文字の日本語1段落。確定データを変更せず、安全条件を守る。"
              }
            },
            required: ["narrative"],
            additionalProperties: false
          }
        }
      })
    });

    if (!response.ok) {
      console.warn("Gemini narrative request failed", {
        model,
        status: response.status
      });
      return fallback;
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as { narrative?: unknown };
    const text =
      typeof parsed.narrative === "string" ? parsed.narrative.trim() : "";
    if (!isAcceptableNarrative(text, allowedManufacturers)) return fallback;
    return text.replace(/^「|」$/g, "");
  } catch (error) {
    console.warn("Gemini narrative fallback", {
      model,
      reason: error instanceof Error ? error.name : "unknown"
    });
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isAcceptableNarrative(
  text: string,
  allowedManufacturers: readonly string[]
): boolean {
  if (text.length < 80 || text.length > 260) return false;
  if (FORBIDDEN.some((pattern) => pattern.test(text))) return false;

  const mentionedManufacturers = KNOWN_MANUFACTURERS.filter((name) =>
    text.includes(name)
  );
  return mentionedManufacturers.every((name) =>
    allowedManufacturers.includes(name)
  );
}
