import { nowIso } from "./date";
import type { FortuneResult, UserRecord } from "./types";

export async function getUser(
  db: D1Database,
  userId: string
): Promise<UserRecord | null> {
  return db
    .prepare("SELECT * FROM users WHERE user_id = ?")
    .bind(userId)
    .first<UserRecord>();
}

export async function ensureUser(
  db: D1Database,
  userId: string
): Promise<void> {
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO users (user_id, adult_confirmed, birth_date, status, created_at, updated_at)
       VALUES (?, 0, NULL, 'active', ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET status = 'active', updated_at = excluded.updated_at`
    )
    .bind(userId, now, now)
    .run();
}

export async function setBirthDate(
  db: D1Database,
  userId: string,
  birthDate: string
): Promise<void> {
  await ensureUser(db, userId);
  await db
    .prepare(
      `UPDATE users
       SET adult_confirmed = 1,
           birth_date = ?,
           birth_time = NULL,
           birth_time_known = -1,
           updated_at = ?
       WHERE user_id = ?`
    )
    .bind(birthDate, nowIso(), userId)
    .run();
  await clearUserFortunes(db, userId);
}

export async function setBirthTime(
  db: D1Database,
  userId: string,
  birthTime: string
): Promise<void> {
  await ensureUser(db, userId);
  await db
    .prepare(
      `UPDATE users
       SET birth_time = ?, birth_time_known = 1, updated_at = ?
       WHERE user_id = ?`
    )
    .bind(birthTime, nowIso(), userId)
    .run();
  await clearUserFortunes(db, userId);
}

export async function setBirthTimeUnknown(
  db: D1Database,
  userId: string
): Promise<void> {
  await ensureUser(db, userId);
  await db
    .prepare(
      `UPDATE users
       SET birth_time = NULL, birth_time_known = 0, updated_at = ?
       WHERE user_id = ?`
    )
    .bind(nowIso(), userId)
    .run();
  await clearUserFortunes(db, userId);
}

export async function markUserInactive(
  db: D1Database,
  userId: string
): Promise<void> {
  await db
    .prepare("UPDATE users SET status = 'inactive', updated_at = ? WHERE user_id = ?")
    .bind(nowIso(), userId)
    .run();
}

export async function deleteUserData(
  db: D1Database,
  userId: string
): Promise<void> {
  await clearUserFortunes(db, userId);
  await db.prepare("DELETE FROM users WHERE user_id = ?").bind(userId).run();
}

export async function getFortune(
  db: D1Database,
  userId: string,
  date: string
): Promise<FortuneResult | null> {
  const row = await db
    .prepare(
      "SELECT payload_json FROM daily_fortunes WHERE user_id = ? AND fortune_date = ?"
    )
    .bind(userId, date)
    .first<{ payload_json: string }>();

  if (!row) return null;
  return JSON.parse(row.payload_json) as FortuneResult;
}

export async function saveFortune(
  db: D1Database,
  userId: string,
  fortune: FortuneResult
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO daily_fortunes
       (user_id, fortune_date, payload_json, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, fortune_date) DO UPDATE SET
         payload_json = excluded.payload_json,
         created_at = excluded.created_at`
    )
    .bind(userId, fortune.date, JSON.stringify(fortune), nowIso())
    .run();
}

export async function claimWebhookEvent(
  db: D1Database,
  webhookEventId: string | undefined
): Promise<boolean> {
  if (!webhookEventId) return true;
  const result = await db
    .prepare(
      "INSERT OR IGNORE INTO processed_events (webhook_event_id, processed_at) VALUES (?, ?)"
    )
    .bind(webhookEventId, nowIso())
    .run();
  return (result.meta.changes ?? 0) > 0;
}

async function clearUserFortunes(
  db: D1Database,
  userId: string
): Promise<void> {
  await db
    .prepare("DELETE FROM daily_fortunes WHERE user_id = ?")
    .bind(userId)
    .run();
}
