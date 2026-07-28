import { fallbackNarrative } from "./fortune";
import type { Env, FortuneResult } from "./types";
import {
  fallbackV2Narrative,
  type V2FortuneDraft
} from "./v2/fortune";

const FORBIDDEN = [
  /必ず勝/,
  /勝てる/,
  /高設定/,
  /設定[1-6]/,
  /当たりやす/,
  /勝率/,
  /期待値が高/,
  /取り返/,
  /追加投資/,
  /投資を増/,
  /追うべき/,
  /借金/,
  /確実/,
  /保証/
];

export async function createNarrative(
  env: Env,
  fortune: Omit<FortuneResult, "narrative">
): Promise<string> {
  const fallback = fallbackNarrative(fortune);
  if (!env.GEMINI_API_KEY) return fallback;

  const data = {
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
  };

  return requestNarrative(env, data, fallback);
}

export async function createV2Narrative(
  env: Env,
  fortune: V2FortuneDraft
): Promise<string> {
  const fallback = fallbackV2Narrative(fortune);
  if (!env.GEMINI_API_KEY) return fallback;

  // 生年月日、出生時刻、LINEユーザーIDはこのオブジェクトへ含めない。
  const anonymousData = {
    engineVersion: fortune.engineVersion,
    overall: fortune.overall,
    rank: fortune.rank,
    scores: {
      draw: fortune.draw,
      selection: fortune.selection,
      flow: fortune.flow,
      calmness: fortune.calmness
    },
    lucky: {
      digit: fortune.luckyDigit,
      numbers: fortune.luckyNumbers,
      color: fortune.luckyColor,
      item: fortune.luckyItem,
      machineStyle: fortune.machineStyle,
      time: fortune.luckyTime
    },
    theme: fortune.theme,
    reasoning: {
      confidence: fortune.analysis.confidence,
      consensus: fortune.analysis.consensus,
      mainFactors: fortune.analysis.mainFactors,
      conflicts: fortune.analysis.conflicts,
      sourceRuleIds: fortune.analysis.sourceRuleIds
    }
  };

  return requestNarrative(env, anonymousData, fallback);
}

async function requestNarrative(
  env: Env,
  data: Record<string, unknown>,
  fallback: string
): Promise<string> {
  const model = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const prompt = [
    "以下の確定済み占いデータだけを材料に、日本語で110〜190文字の鑑定文を1段落で作成してください。",
    "条件:",
    "- 点数、数字、色、アイテム、時刻を変更しない",
    "- mainFactorsとconflictsを要約し、結果の使い方まで説明する",
    "- データにない占術、天体、出来事、店舗、機種名を追加しない",
    "- 勝利、高設定、出玉、回収、追加投資を断定または推奨しない",
    "- 不安、損失、焦りを煽らない",
    "- 占い・娯楽として、落ち着いたが少し期待感のある文体",
    `確定データ: ${JSON.stringify(data)}`
  ].join("\n");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY ?? ""
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "あなたはスロットを題材にした娯楽占いサービス『ヒキヨミ』の文章編集者です。計算や予測はせず、渡された確定データを読みやすい鑑定文へ整形します。"
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
                description: "110〜190文字の日本語1段落。確定データを変更せず、安全条件を守る。"
              }
            },
            required: ["narrative"],
            additionalProperties: false
          }
        }
      })
    });

    if (!response.ok) return fallback;
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
    if (!isAcceptableNarrative(text)) return fallback;
    return text.replace(/^「|」$/g, "");
  } catch {
    return fallback;
  }
}

function isAcceptableNarrative(text: string): boolean {
  if (text.length < 80 || text.length > 260) return false;
  return !FORBIDDEN.some((pattern) => pattern.test(text));
}
