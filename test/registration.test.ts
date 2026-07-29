import { describe, expect, it } from "vitest";
import { normalizeBirthTimeText } from "../src/date";
import { birthDateMessage, birthTimeMessage } from "../src/messages";
import {
  getRegistrationStep,
  isBirthTimeUnknownText
} from "../src/registration";
import type { UserRecord } from "../src/types";
import { foundationInputFromUser } from "../src/v2/user-input";

const baseUrl = "https://hikiyomi.example.workers.dev";

function user(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    user_id: "U_TEST",
    adult_confirmed: 0,
    birth_date: null,
    birth_time: null,
    birth_time_known: 0,
    birth_timezone: null,
    birth_location_json: null,
    status: "active",
    created_at: "2026-07-28T00:00:00.000Z",
    updated_at: "2026-07-28T00:00:00.000Z",
    ...overrides
  };
}

describe("registration flow", () => {
  it("requires only a birth date for initial registration", () => {
    expect(getRegistrationStep(null)).toBe("birth-date");
    expect(
      getRegistrationStep(
        user({
          adult_confirmed: 1,
          birth_date: "1996-04-18",
          birth_time_known: -1
        })
      )
    ).toBe("complete");

    const serialized = JSON.stringify(birthDateMessage(baseUrl));
    expect(serialized).toContain("action=set_birthdate");
    expect(serialized).toContain("出生時刻は不要");
  });

  it("does not ask for birth time after initial birth-date registration", () => {
    const completed = JSON.stringify(birthTimeMessage(baseUrl));
    expect(completed).toContain("準備ができました");
    expect(completed).not.toContain("action=set_birthtime");

    const optionalEdit = JSON.stringify(birthTimeMessage(baseUrl, true));
    expect(optionalEdit).toContain("action=set_birthtime");
    expect(optionalEdit).toContain("action=birthtime_unknown");
    expect(optionalEdit).toContain("覚えていない場合は調べる必要はありません");
  });

  it("normalizes optional time input and recognizes unknown replies", () => {
    expect(normalizeBirthTimeText("9時05分")).toBe("09:05");
    expect(normalizeBirthTimeText("24:00")).toBeNull();
    expect(isBirthTimeUnknownText("分からない")).toBe(true);
  });
});

describe("V2 user input bridge", () => {
  it("passes a known optional birth time to the foundation", () => {
    const input = foundationInputFromUser({
      user: user({
        birth_date: "1996-04-18",
        birth_time: "14:20",
        birth_time_known: 1
      }),
      userId: "U_TEST",
      targetDate: "2026-07-28",
      salt: "test-salt"
    });

    expect(input.birthTimeKnown).toBe(true);
    expect(input.birthTime).toBe("14:20");
  });

  it("treats unselected or unknown birth time as optional", () => {
    for (const birthTimeKnown of [-1, 0]) {
      const input = foundationInputFromUser({
        user: user({
          birth_date: "1996-04-18",
          birth_time: null,
          birth_time_known: birthTimeKnown
        }),
        userId: "U_TEST",
        targetDate: "2026-07-28",
        salt: "test-salt"
      });

      expect(input.birthTimeKnown).toBe(false);
      expect(input.birthTime).toBeNull();
    }
  });
});
