import { afterEach, describe, expect, it, vi } from "vitest";
import { createV2Narrative } from "../src/gemini";
import type { Env } from "../src/types";
import {
  createV2Fortune,
  fallbackV2Narrative
} from "../src/v2/fortune";
import { buildFoundationAssessment } from "../src/v2/rules";

const privateInput = {
  userId: "U_PRIVATE_LINE_USER",
  birthDate: "1996-04-18",
  birthTime: "14:20",
  birthTimeKnown: true,
  targetDate: "2026-07-28",
  salt: "private-test-salt"
};

const baseEnv = {
  DB: {} as D1Database,
  LINE_CHANNEL_SECRET: "line-secret",
  LINE_CHANNEL_ACCESS_TOKEN: "line-token",
  FORTUNE_SALT: "fortune-salt",
  GEMINI_MODEL: "gemini-3.5-flash-lite"
} satisfies Omit<Env, "GEMINI_API_KEY">;

const manufacturerPool = [
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

async function draft() {
  return createV2Fortune(await buildFoundationAssessment(privateInput));
}

function mockGeminiNarrative(text: string) {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ narrative: text }) }]
              }
            }
          ]
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("V2 Gemini narrative", () => {
  it("uses the deterministic fallback when no API key exists", async () => {
    const fortune = await draft();
    const result = await createV2Narrative(baseEnv, fortune);

    expect(result).toBe(fallbackV2Narrative(fortune));
  });

  it("sends only anonymized public result data with a JSON schema", async () => {
    const fortune = await draft();
    const generated = `今日は打ち慣れた機種を軸に候補を絞る日です。相性メーカーは${fortune.compatibleManufacturers.join("と")}。立ち回りテーマを守り、注意ポイントでは時計と予算を確認しながら、ラッキー要素を娯楽として楽しみましょう。メーカー名は占い上の目印として扱ってください。`;
    const fetchMock = mockGeminiNarrative(generated);

    const result = await createV2Narrative(
      { ...baseEnv, GEMINI_API_KEY: "gemini-key" },
      fortune
    );

    expect(result).toBe(generated);
    expect(fetchMock).toHaveBeenCalledOnce();

    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit).toBeDefined();
    const body = JSON.parse(String(requestInit?.body)) as {
      generationConfig: {
        responseMimeType: string;
        responseJsonSchema: unknown;
      };
    };
    const serialized = JSON.stringify(body);

    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseJsonSchema).toBeTruthy();
    expect(serialized).not.toContain(privateInput.userId);
    expect(serialized).not.toContain(privateInput.birthDate);
    expect(serialized).not.toContain(privateInput.birthTime);
    expect(serialized).not.toContain(privateInput.salt);
    expect(serialized).not.toContain('"selection":');
    expect(serialized).not.toContain('"flow":');
    expect(serialized).not.toContain('"calmness":');
    expect(serialized).toContain("manufacturers");
    expect(serialized).toContain("caution");
  });

  it("rejects unsafe gambling claims and returns the fallback", async () => {
    const fortune = await draft();
    mockGeminiNarrative(
      "今日は必ず勝てるので追加投資して取り返せます。高設定を狙って追うべきです。運気が強いので予算を超えても問題ありません。ラッキー要素を信じて最後まで続ければ結果を保証できます。"
    );

    const result = await createV2Narrative(
      { ...baseEnv, GEMINI_API_KEY: "gemini-key" },
      fortune
    );

    expect(result).toBe(fallbackV2Narrative(fortune));
  });

  it("rejects recommendation or affiliation wording about manufacturers", async () => {
    const fortune = await draft();
    mockGeminiNarrative(
      `今日は${fortune.compatibleManufacturers[0]}を推奨します。ヒキヨミ公式認定の相性メーカーなので、提携先として安心して選べます。立ち回りテーマを守り、時計と予算を確認しながら遊技するとよいでしょう。ラッキー要素も合わせて活用してください。`
    );

    const result = await createV2Narrative(
      { ...baseEnv, GEMINI_API_KEY: "gemini-key" },
      fortune
    );

    expect(result).toBe(fallbackV2Narrative(fortune));
  });

  it("rejects manufacturer names outside the deterministic pair", async () => {
    const fortune = await draft();
    const wrongManufacturer = manufacturerPool.find(
      (name) => !fortune.compatibleManufacturers.includes(name)
    );
    expect(wrongManufacturer).toBeDefined();
    mockGeminiNarrative(
      `今日は打ち慣れた機種を軸に候補を絞る日です。相性メーカーは${fortune.compatibleManufacturers[0]}と${wrongManufacturer}。立ち回りテーマを守り、注意ポイントでは時計と予算を確認してください。数字や色は同条件で迷った際の娯楽上の目印として扱いましょう。`
    );

    const result = await createV2Narrative(
      { ...baseEnv, GEMINI_API_KEY: "gemini-key" },
      fortune
    );

    expect(result).toBe(fallbackV2Narrative(fortune));
  });
});
