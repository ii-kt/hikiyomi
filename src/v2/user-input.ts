import type { UserRecord } from "../types";
import type { FoundationInput } from "./types";

export function foundationInputFromUser(input: {
  user: UserRecord;
  userId: string;
  targetDate: string;
  salt: string;
}): FoundationInput {
  const { user } = input;
  if (!user.birth_date) throw new Error("birth date is not registered");
  if (user.birth_time_known < 0) throw new Error("birth time registration is incomplete");

  const birthTimeKnown = user.birth_time_known === 1;
  if (birthTimeKnown && !user.birth_time) {
    throw new Error("known birth time is missing");
  }

  return {
    userId: input.userId,
    birthDate: user.birth_date,
    birthTime: birthTimeKnown ? user.birth_time : null,
    birthTimeKnown,
    targetDate: input.targetDate,
    salt: input.salt
  };
}
