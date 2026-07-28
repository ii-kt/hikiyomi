import { describe, expect, it } from "vitest";
import {
  deleteUserData,
  setBirthDate,
  setBirthTime,
  setBirthTimeUnknown
} from "../src/storage";

function recordingDb() {
  const queries: string[] = [];
  const db = {
    prepare(query: string) {
      queries.push(query.replace(/\s+/g, " ").trim());
      const statement = {
        bind(..._values: unknown[]) {
          return statement;
        },
        async run() {
          return { success: true, meta: { changes: 1 }, results: [] };
        },
        async first() {
          return null;
        }
      };
      return statement;
    }
  } as unknown as D1Database;
  return { db, queries };
}

describe("profile persistence", () => {
  it("invalidates cached fortunes when birth date changes", async () => {
    const { db, queries } = recordingDb();
    await setBirthDate(db, "U_TEST", "1996-04-18");

    expect(queries.some((query) => query.startsWith("UPDATE users"))).toBe(true);
    expect(queries).toContain("DELETE FROM daily_fortunes WHERE user_id = ?");
  });

  it("invalidates cached fortunes for known and unknown birth-time changes", async () => {
    const known = recordingDb();
    await setBirthTime(known.db, "U_TEST", "14:20");
    expect(known.queries).toContain(
      "DELETE FROM daily_fortunes WHERE user_id = ?"
    );

    const unknown = recordingDb();
    await setBirthTimeUnknown(unknown.db, "U_TEST");
    expect(unknown.queries).toContain(
      "DELETE FROM daily_fortunes WHERE user_id = ?"
    );
  });

  it("deletes both saved fortunes and the profile", async () => {
    const { db, queries } = recordingDb();
    await deleteUserData(db, "U_TEST");

    expect(queries).toEqual([
      "DELETE FROM daily_fortunes WHERE user_id = ?",
      "DELETE FROM users WHERE user_id = ?"
    ]);
  });
});
