import { nowIso } from "./date";
import { ensureUser } from "./storage";

export async function setBirthLocation(
  db: D1Database,
  userId: string,
  label: string
): Promise<void> {
  await ensureUser(db, userId);
  await db
    .prepare(
      `UPDATE users
       SET birth_location_json = ?, updated_at = ?
       WHERE user_id = ?`
    )
    .bind(JSON.stringify({ label }), nowIso(), userId)
    .run();
  await db
    .prepare("DELETE FROM daily_fortunes WHERE user_id = ?")
    .bind(userId)
    .run();
}
