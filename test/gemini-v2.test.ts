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

async function draft() {
  return createV2Fortune(await buildFoundationAssessment(privateInput));
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

  it("sends only anonymized confirmed result data with a JSON schema", async () => {
    const fortune = await draft();
    const generated =
      "暦の周期と判断力の指標が今日の軸です。台選び運を活かすには、最初に決めた条件を増やさず、冷静さ運の弱い部分は時計で区切って補うのが適切です。ラッキー要素は結果の保証ではなく、迷った場面で気持ちを整える目印として扱ってください。";
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ narrative: generated }) }]
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    );
    vi.stubGlobal("fetch", fetchMock);

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
  });

  it("rejects unsafe model output and returns the fallback", async () => {
    const fortune = await draft();
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        narrative:
                          "今日は必ず勝てるので追加投資して取り返せます。高設定を狙って追うべきです。"
                      })
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createV2Narrative(
      { ...baseEnv, GEMINI_API_KEY: "gemini-key" },
      fortune
    );

    expect(result).toBe(fallbackV2Narrative(fortune));
  });
});
