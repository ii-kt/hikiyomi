import { afterEach, describe, expect, it, vi } from "vitest";
import { createV2Narrative } from "../src/gemini";
import type { Env } from "../src/types";
import {
  createV2Fortune,
  fallbackV2Narrative
} from "../src/v2/fortune";
import { buildFoundationAssessment } from "../src/v2/rules";

const input = {
  userId: "U_PRIVATE_LINE_USER",
  birthDate: "1996-04-18",
  birthTime: "14:20",
  birthTimeKnown: true,
  targetDate: "2026-07-28",
  salt: "private-test-salt"
};

const env: Env = {
  DB: {} as D1Database,
  LINE_CHANNEL_SECRET: "line-secret",
  LINE_CHANNEL_ACCESS_TOKEN: "line-token",
  FORTUNE_SALT: "fortune-salt",
  GEMINI_API_KEY: "unused-key",
  GEMINI_MODEL: "unused-model"
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("deterministic V3 narrative", () => {
  it("never calls a generative model and returns the code-built summary", async () => {
    const fortune = createV2Fortune(await buildFoundationAssessment(input));
    const fetchMock = vi.fn(async () => {
      throw new Error("network must not be called");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createV2Narrative(env, fortune);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(fallbackV2Narrative(fortune));
    expect(result).toContain(fortune.machineStyle.name);
    expect(result).toContain(fortune.compatibleManufacturers[0]);
    expect(result).toContain(`ラッキー末尾は${fortune.luckyDigit}`);
  });

  it("does not fabricate technical reasons, personality, or gambling claims", async () => {
    const fortune = createV2Fortune(await buildFoundationAssessment(input));
    const result = await createV2Narrative(env, fortune);

    expect(result).not.toMatch(/六十干支距離|参考度|一致度|性格|判断力|冷静さ/);
    expect(result).not.toMatch(
      /必ず勝|勝てる|高設定|設定状況が良い|取り返せる|追加投資|借金|保証/
    );
  });
});
