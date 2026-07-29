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

describe("V2 final fortune", () => {
  it("returns exactly the same result for the same assessment input", async () => {
    expect(await resultFor()).toEqual(await resultFor());
  });

  it("changes when the target date changes", async () => {
    expect(await resultFor({ targetDate: "2026-07-29" })).not.toEqual(
      await resultFor()
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

  it("produces practical guidance, manufacturer candidates, and lucky elements", async () => {
    const result = await resultFor();

    expect(result.engineVersion).toBe(V2_ENGINE_VERSION);
    expect(V2_ENGINE_VERSION).toBe("v2-fortune-2");
    expect(result.luckyDigit).toBeGreaterThanOrEqual(0);
    expect(result.luckyDigit).toBeLessThanOrEqual(9);
    expect(result.luckyNumbers[0]).toBeGreaterThanOrEqual(1);
    expect(result.luckyNumbers[0]).toBeLessThanOrEqual(60);
    expect(result.luckyNumbers[1]).toBeGreaterThanOrEqual(1);
    expect(result.luckyNumbers[1]).toBeLessThanOrEqual(99);
    expect(result.luckyColor.name.length).toBeGreaterThan(0);
    expect(result.luckyItem.meaning.length).toBeGreaterThan(0);
    expect(result.machineStyle.meaning.length).toBeGreaterThan(0);
    expect(result.compatibleManufacturers).toHaveLength(2);
    expect(result.compatibleManufacturers[0]).not.toBe(
      result.compatibleManufacturers[1]
    );
    expect(result.compatibleManufacturers.every((name) => name.length > 0)).toBe(
      true
    );
    expect(result.luckyTime).toMatch(/^\d{2}:00〜\d{2}:00$/);
    expect(result.theme.length).toBeGreaterThan(10);
    expect(result.caution.length).toBeGreaterThan(10);
  });

  it("keeps provenance, consensus, factors and conflicts in the result", async () => {
    const result = await resultFor();

    expect(result.analysis.assessmentVersion).toBe("v2-foundation-1");
    expect(result.analysis.consensus).toBeGreaterThanOrEqual(0.35);
    expect(result.analysis.consensus).toBeLessThanOrEqual(0.98);
    expect(result.analysis.mainFactors.length).toBeGreaterThanOrEqual(2);
    expect(result.analysis.sourceRuleIds).toContain("FINAL-SCORE-MAP-001");
    expect(result.analysis.sourceRuleIds).toContain("LUCKY-DERIVATION-001");
    expect(result.analysis.sourceRuleIds).toContain(
      "MANUFACTURER-DERIVATION-001"
    );
    expect(result.analysis.sourceIds.length).toBeGreaterThan(0);
  });

  it("creates a safe, self-contained fallback narrative", async () => {
    const result = await resultFor();
    const narrative = fallbackV2Narrative(result);

    expect(narrative).toContain(`末尾${result.luckyDigit}`);
    expect(narrative).toContain(result.theme);
    expect(narrative).toContain(result.caution);
    expect(narrative).toContain(result.compatibleManufacturers[0]);
    expect(narrative.length).toBeGreaterThanOrEqual(80);
    expect(narrative).not.toMatch(
      /必ず勝|勝てる|高設定|取り返|追加投資|投資を増|借金|保証/
    );
  });
});
