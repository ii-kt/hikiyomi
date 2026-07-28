const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayJst(now = new Date()): string {
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

export function cutoffDateForAdult(now = new Date()): string {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const year = jst.getUTCFullYear() - 18;
  const month = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jst.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isAdultBirthDate(value: string, now = new Date()): boolean {
  return isValidIsoDate(value) && value <= cutoffDateForAdult(now);
}

export function normalizeBirthDateText(text: string): string | null {
  const compact = text.trim()
    .replace(/年/g, "-")
    .replace(/月/g, "-")
    .replace(/日/g, "")
    .replace(/[/.]/g, "-");

  const match = compact.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  if (!year || !month || !day) return null;
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return isValidIsoDate(normalized) ? normalized : null;
}

export function isValidTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function normalizeBirthTimeText(text: string): string | null {
  const compact = text.trim()
    .replace(/時/g, ":")
    .replace(/分/g, "")
    .replace(/[.]/g, ":");

  const match = compact.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;
  const [, hour, minute] = match;
  if (!hour || !minute) return null;
  const normalized = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  return isValidTime(normalized) ? normalized : null;
}
