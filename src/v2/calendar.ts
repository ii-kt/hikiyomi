import type {
  BranchInfo,
  CalendarFacts,
  FiveElement,
  Polarity,
  SexagenaryDay,
  StemInfo
} from "./types";

const STEMS: readonly StemInfo[] = [
  { index: 0, kanji: "甲", reading: "きのえ", element: "wood", polarity: "yang" },
  { index: 1, kanji: "乙", reading: "きのと", element: "wood", polarity: "yin" },
  { index: 2, kanji: "丙", reading: "ひのえ", element: "fire", polarity: "yang" },
  { index: 3, kanji: "丁", reading: "ひのと", element: "fire", polarity: "yin" },
  { index: 4, kanji: "戊", reading: "つちのえ", element: "earth", polarity: "yang" },
  { index: 5, kanji: "己", reading: "つちのと", element: "earth", polarity: "yin" },
  { index: 6, kanji: "庚", reading: "かのえ", element: "metal", polarity: "yang" },
  { index: 7, kanji: "辛", reading: "かのと", element: "metal", polarity: "yin" },
  { index: 8, kanji: "壬", reading: "みずのえ", element: "water", polarity: "yang" },
  { index: 9, kanji: "癸", reading: "みずのと", element: "water", polarity: "yin" }
];

const BRANCHES: readonly BranchInfo[] = [
  { index: 0, kanji: "子", reading: "ね", element: "water", polarity: "yang", timeRange: "23:00-00:59" },
  { index: 1, kanji: "丑", reading: "うし", element: "earth", polarity: "yin", timeRange: "01:00-02:59" },
  { index: 2, kanji: "寅", reading: "とら", element: "wood", polarity: "yang", timeRange: "03:00-04:59" },
  { index: 3, kanji: "卯", reading: "う", element: "wood", polarity: "yin", timeRange: "05:00-06:59" },
  { index: 4, kanji: "辰", reading: "たつ", element: "earth", polarity: "yang", timeRange: "07:00-08:59" },
  { index: 5, kanji: "巳", reading: "み", element: "fire", polarity: "yin", timeRange: "09:00-10:59" },
  { index: 6, kanji: "午", reading: "うま", element: "fire", polarity: "yang", timeRange: "11:00-12:59" },
  { index: 7, kanji: "未", reading: "ひつじ", element: "earth", polarity: "yin", timeRange: "13:00-14:59" },
  { index: 8, kanji: "申", reading: "さる", element: "metal", polarity: "yang", timeRange: "15:00-16:59" },
  { index: 9, kanji: "酉", reading: "とり", element: "metal", polarity: "yin", timeRange: "17:00-18:59" },
  { index: 10, kanji: "戌", reading: "いぬ", element: "earth", polarity: "yang", timeRange: "19:00-20:59" },
  { index: 11, kanji: "亥", reading: "い", element: "water", polarity: "yin", timeRange: "21:00-22:59" }
];

export function getSexagenaryDay(isoDate: string): SexagenaryDay {
  const { year, month, day } = parseIsoDate(isoDate);
  const julianDayNumber = gregorianToJulianDayNumber(year, month, day);
  const index = positiveModulo(julianDayNumber + 49, 60);
  const stem = required(STEMS[index % 10], "stem");
  const branch = required(BRANCHES[index % 12], "branch");

  return {
    index,
    label: `${stem.kanji}${branch.kanji}`,
    stem,
    branch,
    julianDayNumber,
    sourceIds: ["NAOJ-KANSHI-001"]
  };
}

export function getHourBranch(time: string | null | undefined): BranchInfo | null {
  if (time == null || time === "") return null;

  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) throw new Error("birth time must use HH:mm");

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new Error("birth time is outside 00:00-23:59");
  }

  const branchIndex = Math.floor(((hour + 1) % 24) / 2);
  return required(BRANCHES[branchIndex], "hour branch");
}

export function reduceNumerology(isoDate: string): number {
  parseIsoDate(isoDate);
  let value = [...isoDate.replaceAll("-", "")].reduce(
    (sum, digit) => sum + Number(digit),
    0
  );

  while (value > 9) {
    value = [...String(value)].reduce((sum, digit) => sum + Number(digit), 0);
  }

  return Math.max(value, 1);
}

export function buildCalendarFacts(input: {
  birthDate: string;
  birthTime?: string | null;
  birthTimeKnown: boolean;
  targetDate: string;
}): CalendarFacts {
  if (input.birthTimeKnown && !input.birthTime) {
    throw new Error("birthTime is required when birthTimeKnown is true");
  }

  const birthHourBranch = input.birthTimeKnown
    ? getHourBranch(input.birthTime)
    : null;

  return {
    birthDate: input.birthDate,
    targetDate: input.targetDate,
    birthNumerology: reduceNumerology(input.birthDate),
    targetNumerology: reduceNumerology(input.targetDate),
    birthDay: getSexagenaryDay(input.birthDate),
    targetDay: getSexagenaryDay(input.targetDate),
    birthTimeKnown: input.birthTimeKnown,
    birthHourBranch,
    sourceIds: [
      "NAOJ-KANSHI-001",
      ...(birthHourBranch ? ["NAOJ-JUNISHI-TIME-001"] : []),
      "HIKIYOMI-METHOD-001"
    ]
  };
}

export function elementGenerates(from: FiveElement, to: FiveElement): boolean {
  const cycle: Record<FiveElement, FiveElement> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood"
  };
  return cycle[from] === to;
}

export function polarityMatches(a: Polarity, b: Polarity): boolean {
  return a === b;
}

function parseIsoDate(value: string): {
  year: number;
  month: number;
  day: number;
} {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("date must use YYYY-MM-DD");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    year < 1 ||
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error("invalid Gregorian date");
  }

  return { year, month, day };
}

function gregorianToJulianDayNumber(
  year: number,
  month: number,
  day: number
): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`missing ${name}`);
  return value;
}
