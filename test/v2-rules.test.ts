import { describe, expect, it } from "vitest";
import {
  buildFoundationAssessment,
  FOUNDATION_RULES,
  validateRuleSources
} from "../src/v2/rules";
import { sourceExists } from "../src/v2/source-registry";

const knownTimeInput = {
  userId: "U_TEST_V2_001",
  birthDate: "1996-04-18",
  birthTime: "14:20",
  birthTimeKnown: true,
  targetDate: "2026-07-28",
  salt: "v2-test-salt"
};

describe("V2 traceable rules", () => {
  it("registers only rules whose source IDs exist", () => {
    expect(() => validateRuleSources()).not.toThrow();

    for (const rule of FOUNDATION_RULES) {
      expect(rule.sourceIds.length).toBeGreaterThan(0);
      expect(rule.sourceIds.every(sourceExists)).toBe(true);
    }
  });

  it("returns the same assessment for the same inputs", async () => {
    const first = await buildFoundationAssessment(knownTimeInput);
    const second = await buildFoundationAssessment(knownTimeInput);

    expect(second).toEqual(first);
  });

  it("records the exact rule, reason and source for every score change", async () => {
    const result = await buildFoundationAssessment(knownTimeInput);

    expect(result.contributions.length).toBeGreaterThan(0);
    for (const item of result.contributions) {
      expect(item.ruleId.length).toBeGreaterThan(0);
      expect(item.basis.length).toBeGreaterThan(0);
      expect(item.sourceIds.length).toBeGreaterThan(0);
      expect(item.sourceIds.every(sourceExists)).toBe(true);
    }
  });

  it("uses known birth time only as a separate, traceable contribution", async () => {
    const known = await buildFoundationAssessment(knownTimeInput);
    const unknown = await buildFoundationAssessment({
      ...knownTimeInput,
      birthTime: null,
      birthTimeKnown: false
    });

    expect(known.contributions.some((item) => item.kind === "birth-time")).toBe(true);
    expect(unknown.contributions.some((item) => item.kind === "birth-time")).toBe(false);
  });

  it("separates calendar and custom variation contributions", async () => {
    const result = await buildFoundationAssessment(knownTimeInput);
    const kinds = new Set(result.contributions.map((item) => item.kind));

    expect(kinds.has("calendar")).toBe(true);
    for (const variation of result.contributions.filter(
      (item) => item.kind === "deterministic-variation"
    )) {
      expect(Math.abs(variation.delta)).toBeLessThanOrEqual(2);
    }
  });

  it("keeps intermediate metric scores inside the allowed range", async () => {
    const result = await buildFoundationAssessment(knownTimeInput);

    for (const metric of Object.values(result.metrics)) {
      expect(metric.score).toBeGreaterThanOrEqual(20);
      expect(metric.score).toBeLessThanOrEqual(95);
    }
  });
});
