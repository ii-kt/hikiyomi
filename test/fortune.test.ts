import { describe, expect, it } from "vitest";
import { createFortune, fallbackNarrative } from "../src/fortune";

const baseInput = {
  userId: "U_TEST_USER_001",
  birthDate: "1996-04-18",
  date: "2026-07-28",
  salt: "test-only-fortune-salt"
};

describe("createFortune", () => {
  it("returns exactly the same result for the same user, birth date, date, and salt", async () => {
    const first = await createFortune(baseInput);
    const second = await createFortune(baseInput);

    expect(second).toEqual(first);
  });

  it("changes the result when the target date changes", async () => {
    const first = await createFortune(baseInput);
    const nextDay = await createFortune({ ...baseInput, date: "2026-07-29" });

    expect(nextDay).not.toEqual(first);
  });

  it("changes the result between users on the same day", async () => {
    const first = await createFortune(baseInput);
    const anotherUser = await createFortune({ ...baseInput, userId: "U_TEST_USER_002" });

    expect(anotherUser).not.toEqual(first);
  });

  it("keeps all scores and lucky values inside their defined ranges", async () => {
    const result = await createFortune(baseInput);

    expect(result.draw).toBeGreaterThanOrEqual(20);
    expect(result.draw).toBeLessThanOrEqual(99);
    expect(result.selection).toBeGreaterThanOrEqual(20);
    expect(result.selection).toBeLessThanOrEqual(99);
    expect(result.flow).toBeGreaterThanOrEqual(20);
    expect(result.flow).toBeLessThanOrEqual(99);
    expect(result.calmness).toBeGreaterThanOrEqual(28);
    expect(result.calmness).toBeLessThanOrEqual(99);
    expect(result.overall).toBeGreaterThanOrEqual(18);
    expect(result.overall).toBeLessThanOrEqual(98);
    expect(result.luckyDigit).toBeGreaterThanOrEqual(0);
    expect(result.luckyDigit).toBeLessThanOrEqual(9);
    expect(result.luckyNumbers[0]).toBeGreaterThanOrEqual(1);
    expect(result.luckyNumbers[0]).toBeLessThanOrEqual(99);
    expect(result.luckyNumbers[1]).toBeGreaterThanOrEqual(1);
    expect(result.luckyNumbers[1]).toBeLessThanOrEqual(99);
    expect(result.luckyNumbers[1]).not.toBe(result.luckyNumbers[0]);
  });

  it("calculates the overall score from the four component scores", async () => {
    const result = await createFortune(baseInput);
    const expected = Math.min(
      98,
      Math.max(
        18,
        Math.round(
          result.draw * 0.3 +
            result.selection * 0.25 +
            result.flow * 0.2 +
            result.calmness * 0.25
        )
      )
    );

    expect(result.overall).toBe(expected);
  });

  it("assigns a rank consistent with the overall score", async () => {
    const result = await createFortune(baseInput);
    const expectedRank =
      result.overall >= 90
        ? "超強運"
        : result.overall >= 80
          ? "強運"
          : result.overall >= 65
            ? "好調"
            : result.overall >= 45
              ? "平常"
              : result.overall >= 30
                ? "慎重"
                : "休養推奨";

    expect(result.rank).toBe(expectedRank);
  });

  it("returns complete display data without empty labels or meanings", async () => {
    const result = await createFortune(baseInput);

    expect(result.luckyColor.name.length).toBeGreaterThan(0);
    expect(result.luckyColor.meaning.length).toBeGreaterThan(0);
    expect(result.luckyItem.name.length).toBeGreaterThan(0);
    expect(result.luckyItem.meaning.length).toBeGreaterThan(0);
    expect(result.machineStyle.name.length).toBeGreaterThan(0);
    expect(result.machineStyle.meaning.length).toBeGreaterThan(0);
    expect(result.luckyTime).toMatch(/^\d{2}:00〜\d{2}:00$/);
    expect(result.theme.length).toBeGreaterThan(0);
  });
});

describe("fallbackNarrative", () => {
  it("creates a self-contained explanation from a confirmed fortune result", async () => {
    const result = await createFortune(baseInput);
    const narrative = fallbackNarrative(result);

    expect(narrative).toContain(result.theme);
    expect(narrative).toContain(`末尾${result.luckyDigit}`);
    expect(narrative.length).toBeGreaterThanOrEqual(70);
    expect(narrative).not.toMatch(/必ず勝|高設定|取り返|追加投資|保証/);
  });
});
