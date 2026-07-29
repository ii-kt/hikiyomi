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

describe("V4 final fortune", () => {
  it("returns exactly the same result for the same assessment input", async () => {
    expect(await resultFor()).toEqual(await resultFor());
  });

  it("changes when the target date changes", async () => {
    expect(await resultFor({ targetDate: "2026-07-29" })).not.toEqual(
      await resultFor()
    );
  });

  it("does not let secret variation change the displayed result", async () => {
    expect(await resultFor({ salt: "salt-a" })).toEqual(
      await resultFor({ salt: "salt-b" })
    );
  });

  it("creates the public and internal scores inside the allowed range", async () => {
    const result = await resultFor();

    for (const score of [
      result.overall,
      result.draw,
      result.selection,
      result.flow,
      result.calmness
    ]) {
      expect(score).toBeGreaterThanOrEqual(20);
      expect(score).toBeLessThanOrEqual(95);
    }

    expect(result.overall).toBe(
      Math.round(
        result.draw * 0.3 +
          result.selection * 0.25 +
          result.flow * 0.2 +
          result.calmness * 0.25
      )
    );
  });

  it("produces only fortune-focused public fields", async () => {
    const result = await resultFor();
    const slotTypes = ["Aタイプ", "AT機", "スマスロAT機", "メダルAT機"];

    expect(result.engineVersion).toBe(V2_ENGINE_VERSION);
    expect(V2_ENGINE_VERSION).toBe("v2-fortune-4");
    expect(slotTypes).toContain(result.machineStyle.name);
    expect(result.compatibleManufacturers).toHaveLength(2);
    expect(result.compatibleManufacturers[0]).not.toBe(
      result.compatibleManufacturers[1]
    );
    expect(result.luckyDigit).toBeGreaterThanOrEqual(0);
    expect(result.luckyDigit).toBeLessThanOrEqual(9);
    expect(result.luckyItem).toBeUndefined();
    expect(result.theme).toBeUndefined();
    expect(result.caution).toBeUndefined();
  });

  it("removes safety guidance provenance from the fortune result", async () => {
    const result = await resultFor();

    expect(result.analysis.assessmentVersion).toBe("v2-foundation-1");
    expect(result.analysis.consensus).toBeGreaterThanOrEqual(0.35);
    expect(result.analysis.consensus).toBeLessThanOrEqual(0.98);
    expect(result.analysis.mainFactors.length).toBeGreaterThanOrEqual(2);
    expect(result.analysis.sourceRuleIds).toContain("FINAL-SCORE-MAP-002");
    expect(result.analysis.sourceRuleIds).toContain("SLOT-TYPE-SYMBOLIC-001");
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
    expect(narrative).not.toMatch(/上限|取り返|休憩|終了時刻|小さなメモ/);
  });
});
