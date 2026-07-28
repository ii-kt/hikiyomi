import type { UserRecord } from "./types";

export type RegistrationStep = "birth-date" | "birth-time" | "complete";

export function getRegistrationStep(user: UserRecord | null): RegistrationStep {
  if (!user?.birth_date) return "birth-date";
  if (user.birth_time_known < 0) return "birth-time";
  return "complete";
}

export function isBirthTimeUnknownText(text: string): boolean {
  return /^(不明|わからない|分からない|知らない|覚えていない)$/.test(text.trim());
}
