import type { UserRecord } from "./types";

/** "birth-time" is retained for call-site compatibility but is no longer returned. */
export type RegistrationStep = "birth-date" | "birth-time" | "complete";

export function getRegistrationStep(user: UserRecord | null): RegistrationStep {
  return user?.birth_date ? "complete" : "birth-date";
}

export function isBirthTimeUnknownText(text: string): boolean {
  return /^(不明|わからない|分からない|知らない|覚えていない)$/.test(text.trim());
}
