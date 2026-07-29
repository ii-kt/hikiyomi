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

describe("V3 final fortune", () => {
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

  it("produces concrete slot types, manufacturer candidates, and safe guidance", async () => {
    const result = await resultFor();
    const slotTypes = ["Aタイプ", "AT機", "スマスロAT機", "メダルAT機"];

    expect(result.engineVersion).toBe(V2_ENGINE_VERSION);
    expect(V2_ENGINE_VERSION).toBe("v2-fortune-3");
    expect(slotTypes).toContain(result.machineStyle.name);
    expect(result.machineStyle.meaning).toContain("占い上の候補");
    expect(result.compatibleManufacturers).toHaveLength(2);
    expect(result.compatibleManufacturers[0]).not.toBe(
      result.compatibleManufacturers[1]
    );
    expect(result.luckyDigit).toBeGreaterThanOrEqual(0);
    expect(result.luckyDigit).toBeLessThanOrEqual(9);
    expect(result.theme.length).toBeGreaterThan(8);
    expect(result.caution.length).toBeGreaterThan(8);
    expect(`${result.theme}${result.caution}`).toMatch(
      /終了時刻|上限|休憩|候補|取り返|見送/
    );
  });

  it("keeps provenance internally without presenting it as win probability", async () => {
    const result = await resultFor();

    expect(result.analysis.assessmentVersion).toBe("v2-foundation-1");
    expect(result.analysis.consensus).toBeGreaterThanOrEqual(0.35);
    expect(result.analysis.consensus).toBeLessThanOrEqual(0.98);
    expect(result.analysis.mainFactors.length).toBeGreaterThanOrEqual(2);
    expect(result.analysis.sourceRuleIds).toContain("FINAL-SCORE-MAP-002");
    expect(result.analysis.sourceRuleIds).toContain("SLOT-TYPE-SYMBOLIC-001");
    expect(result.analysis.sourceRuleIds).toContain("SAFE-GUIDANCE-001");
    expect(result.analysis.sourceIds).toContain("WHO-GAMBLING-001");
  });

  it("creates a short deterministic summary without invented reasons", async () => {
    const result = await resultFor();
    const narrative = fallbackV2Narrative(result);

    expect(narrative).toContain(`ラッキー末尾は${result.luckyDigit}`);
    expect(narrative).toContain(result.machineStyle.name);
    expect(narrative).toContain(result.theme);
    expect(narrative).toContain(result.caution);
    expect(narrative).toContain(result.compatibleManufacturers[0]);
    expect(narrative).not.toMatch(/六十干支距離|参考度|一致度/);
    expect(narrative).not.toMatch(
      /必ず勝|勝てる|高設定|取り返せる|追加投資|投資を増|借金|保証/
    );
  });
});
