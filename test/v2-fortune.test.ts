import { describe, expect, it } from "vitest";
import {
  createV2Fortune,
  fallbackV2Narrative,
  V2_ENGINE_VERSION
} from "../src/v2/fortune";
import { buildFoundationAssessment } from "../src/v2/rules";

const baseInput = {
  userId: "U_V2_FORTUNE_001",
  birthDate: "1996-04-18",
  birthTime: "14:20",
  birthTimeKnown: true,
  targetDate: "2026-07-28",
  salt: "v2-fortune-test-salt"
};

async function resultFor(overrides: Partial<typeof baseInput> = {}) {
  const assessment = await buildFoundationAssessment({
    ...baseInput,
    ...overrides
  });
  return createV2Fortune(assessment);
}

describe("V6 final fortune", () => {
  it("returns exactly the same result for the same assessment input", async () => {
    expect(await resultFor()).toEqual(await resultFor());
  });

  it("changes when the target date changes", async () => {
    expect(await resultFor({ targetDate: "2026-07-29" })).not.toEqual(
      await resultFor()
    );
  });

  it("does not let the secret salt change the displayed result", async () => {
    expect(await resultFor({ salt: "salt-a" })).toEqual(
      await resultFor({ salt: "salt-b" })
    );
  });

  it("calculates the displayed score directly from the visible components", async () => {
    const result = await resultFor();
    const systems = result.analysis.systems ?? [];
    const score = (id: string) =>
      systems.find((system) => system.id === id)?.score ?? 50;
    const expected = Math.round(
      score("five-elements") * 0.3 +
        score("branches") * 0.2 +
        score("sexagenary") * 0.2 +
        score("numerology") * 0.15 +
        score("birth-time") * 0.15
    );

    expect(result.overall).toBe(expected);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.analysis.scoreScale?.kind).toBe("annual-percentile");
    expect(result.analysis.scoreScale?.totalDays).toBe(365);
    expect(result.analysis.scoreScale?.rankFromTop).toBeGreaterThanOrEqual(1);
    expect(result.analysis.scoreScale?.rankFromTop).toBeLessThanOrEqual(365);
  });

  it("produces visibly different scores across the year", async () => {
    const dates = [
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
      "2026-05-15",
      "2026-06-15",
      "2026-07-15",
      "2026-08-15",
      "2026-09-15",
      "2026-10-15",
      "2026-11-15",
      "2026-12-15"
    ];
    const scores = await Promise.all(
      dates.map(async (targetDate) => (await resultFor({ targetDate })).overall)
    );

    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(25);
  });

  it("creates the public fields and detailed deterministic readings", async () => {
    const result = await resultFor();
    const slotTypes = ["Aタイプ", "AT機", "スマスロAT機", "メダルAT機"];

    expect(result.engineVersion).toBe(V2_ENGINE_VERSION);
    expect(V2_ENGINE_VERSION).toBe("v2-fortune-6");
    expect(slotTypes).toContain(result.machineStyle.name);
    expect(result.compatibleManufacturers).toHaveLength(2);
    expect(result.compatibleManufacturers[0]).not.toBe(
      result.compatibleManufacturers[1]
    );
    expect(result.luckyDigit).toBeGreaterThanOrEqual(0);
    expect(result.luckyDigit).toBeLessThanOrEqual(9);
    expect(result.analysis.systems?.length).toBeGreaterThanOrEqual(4);
    expect(result.analysis.slotSummary).toContain("要するにスロットでいうと");
    expect(result.analysis.birthTimeUsed).toBe(true);
    expect(result.luckyItem).toBeUndefined();
    expect(result.theme).toBeUndefined();
    expect(result.caution).toBeUndefined();
  });

  it("keeps provenance and separates score calculation from annual rank", async () => {
    const result = await resultFor();

    expect(result.analysis.assessmentVersion).toBe("v2-foundation-1");
    expect(result.analysis.consensus).toBeGreaterThanOrEqual(0.2);
    expect(result.analysis.consensus).toBeLessThanOrEqual(0.98);
    expect(result.analysis.mainFactors.length).toBeGreaterThanOrEqual(4);
    expect(result.analysis.sourceRuleIds).toContain(
      "ANNUAL-PERCENTILE-SCALE-001"
    );
    expect(result.analysis.sourceRuleIds).toContain("FINAL-SCORE-MAP-004");
    expect(result.analysis.sourceRuleIds).not.toContain("FINAL-SCORE-MAP-003");
    expect(result.analysis.sourceRuleIds).not.toContain("SAFE-GUIDANCE-001");
    expect(result.analysis.sourceIds).not.toContain("WHO-GAMBLING-001");
  });

  it("creates a short deterministic fortune summary", async () => {
    const result = await resultFor();
    const narrative = fallbackV2Narrative(result);

    expect(narrative).toContain(`ラッキー末尾は${result.luckyDigit}`);
    expect(narrative).toContain(result.machineStyle.name);
    expect(narrative).toContain(result.compatibleManufacturers[0]);
    expect(narrative).toContain(result.luckyColor.name);
    expect(narrative).toContain("日中、上位");
    expect(narrative).not.toMatch(/上限|取り返|休憩|終了時刻|小さなメモ/);
  });
});
