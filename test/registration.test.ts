import { describe, expect, it } from "vitest";
import { normalizeBirthTimeText } from "../src/date";
import { birthDateMessage, birthTimeMessage } from "../src/messages";
import { getRegistrationStep, isBirthTimeUnknownText } from "../src/registration";
import type { UserRecord } from "../src/types";
import { foundationInputFromUser } from "../src/v2/user-input";

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
  it("starts with birth date instead of a separate age confirmation", () => {
    expect(getRegistrationStep(null)).toBe("birth-date");
    expect(JSON.stringify(birthDateMessage())).not.toContain("adult_yes");
    expect(JSON.stringify(birthDateMessage())).not.toContain("18歳以上です");
  });

  it("moves to birth time after an adult birth date is stored", () => {
    const pending = user({
      adult_confirmed: 1,
      birth_date: "1996-04-18",
      birth_time_known: -1
    });

    expect(getRegistrationStep(pending)).toBe("birth-time");
    const message = JSON.stringify(birthTimeMessage());
    expect(message).toContain("set_birthtime");
    expect(message).toContain("birthtime_unknown");
  });

  it("accepts known or unknown birth time as registration complete", () => {
    expect(
      getRegistrationStep(
        user({ birth_date: "1996-04-18", birth_time: "14:20", birth_time_known: 1 })
      )
    ).toBe("complete");
    expect(
      getRegistrationStep(
        user({ birth_date: "1996-04-18", birth_time: null, birth_time_known: 0 })
      )
    ).toBe("complete");
  });

  it("normalizes text time input and recognizes unknown replies", () => {
    expect(normalizeBirthTimeText("9時05分")).toBe("09:05");
    expect(normalizeBirthTimeText("24:00")).toBeNull();
    expect(isBirthTimeUnknownText("分からない")).toBe(true);
  });
});

describe("V2 user input bridge", () => {
  it("passes a known birth time to the V2 foundation", () => {
    const input = foundationInputFromUser({
      user: user({ birth_date: "1996-04-18", birth_time: "14:20", birth_time_known: 1 }),
      userId: "U_TEST",
      targetDate: "2026-07-28",
      salt: "test-salt"
    });

    expect(input.birthTimeKnown).toBe(true);
    expect(input.birthTime).toBe("14:20");
  });

  it("passes unknown birth time without fabricating a time", () => {
    const input = foundationInputFromUser({
      user: user({ birth_date: "1996-04-18", birth_time: null, birth_time_known: 0 }),
      userId: "U_TEST",
      targetDate: "2026-07-28",
      salt: "test-salt"
    });

    expect(input.birthTimeKnown).toBe(false);
    expect(input.birthTime).toBeNull();
  });

  it("rejects an incomplete birth-time registration", () => {
    expect(() =>
      foundationInputFromUser({
        user: user({ birth_date: "1996-04-18", birth_time_known: -1 }),
        userId: "U_TEST",
        targetDate: "2026-07-28",
        salt: "test-salt"
      })
    ).toThrow("incomplete");
  });
});
