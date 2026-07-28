import { describe, expect, it } from "vitest";
import {
  buildCalendarFacts,
  getHourBranch,
  getSexagenaryDay,
  reduceNumerology
} from "../src/v2/calendar";

describe("V2 calendar foundation", () => {
  it("returns to the same sexagenary day after 60 days", () => {
    const first = getSexagenaryDay("2026-07-28");
    const sixtyDaysLater = getSexagenaryDay("2026-09-26");

    expect(first.index).toBe(sixtyDaysLater.index);
    expect(first.label).toBe(sixtyDaysLater.label);
  });

  it("calculates a known modern sexagenary day", () => {
    expect(getSexagenaryDay("2026-07-28").label).toBe("癸卯");
  });

  it("maps fixed two-hour ranges to the correct branch", () => {
    expect(getHourBranch("23:00")?.kanji).toBe("子");
    expect(getHourBranch("00:59")?.kanji).toBe("子");
    expect(getHourBranch("01:00")?.kanji).toBe("丑");
    expect(getHourBranch("14:20")?.kanji).toBe("未");
    expect(getHourBranch("22:59")?.kanji).toBe("亥");
  });

  it("keeps unknown birth time null without adding a penalty", () => {
    const facts = buildCalendarFacts({
      birthDate: "1996-04-18",
      birthTimeKnown: false,
      targetDate: "2026-07-28"
    });

    expect(facts.birthHourBranch).toBeNull();
    expect(facts.sourceIds).not.toContain("NAOJ-JUNISHI-TIME-001");
  });

  it("requires a time only when the user says it is known", () => {
    expect(() =>
      buildCalendarFacts({
        birthDate: "1996-04-18",
        birthTimeKnown: true,
        targetDate: "2026-07-28"
      })
    ).toThrow(/birthTime is required/);
  });

  it("reduces date digits to 1 through 9", () => {
    expect(reduceNumerology("1996-04-18")).toBe(2);
    expect(reduceNumerology("2026-07-28")).toBeGreaterThanOrEqual(1);
    expect(reduceNumerology("2026-07-28")).toBeLessThanOrEqual(9);
  });
});
