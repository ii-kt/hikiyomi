import { hashToUint32 } from "./crypto";
import type { FortuneItem, FortuneResult } from "./types";

const COLORS: FortuneItem[] = [
  { name: "ネイビー", meaning: "状況を落ち着いて見直す色" },
  { name: "ゴールド", meaning: "決断に区切りをつける色" },
  { name: "エメラルド", meaning: "流れを安定させる色" },
  { name: "パープル", meaning: "直感を言葉に変える色" },
  { name: "ホワイト", meaning: "先入観をいったん外す色" },
  { name: "ブラック", meaning: "集中を保ちやすくする色" },
  { name: "オレンジ", meaning: "停滞した気分を切り替える色" },
  { name: "シルバー", meaning: "小さな変化を観察する色" }
];

const ITEMS: FortuneItem[] = [
  { name: "腕時計", meaning: "時間を確認する動作が判断の区切りになります" },
  { name: "無糖の飲み物", meaning: "一口飲む時間が冷静さを戻します" },
  { name: "ミントガム", meaning: "気分を切り替える合図になります" },
  { name: "青い小物", meaning: "焦ったときに視線を戻す目印になります" },
  { name: "ハンカチ", meaning: "一度手を止めるきっかけになります" },
  { name: "イヤホンケース", meaning: "移動前後の気持ちを切り替える印になります" },
  { name: "小さなメモ", meaning: "最初に決めた基準を忘れない助けになります" },
  { name: "銀色の小物", meaning: "細かな違和感に気づく目印になります" }
];

const MACHINE_STYLES: FortuneItem[] = [
  { name: "打ち慣れた機種", meaning: "知っている挙動を落ち着いて見られる日" },
  { name: "ノーマルタイプ", meaning: "派手さより観察を楽しむ日" },
  { name: "短時間で区切れる機種", meaning: "時間を先に決めるほど流れを活かせる日" },
  { name: "演出を楽しめる機種", meaning: "結果だけに寄りすぎず遊技を楽しむ日" },
  { name: "技術介入タイプ", meaning: "手順を丁寧に守ることと相性がよい日" },
  { name: "いつも避けがちなタイプ", meaning: "先入観を外して眺めることに意味がある日" }
];

const THEMES = [
  "最初に決めた基準を変えない",
  "迷ったら一度席を離れて見直す",
  "数字より自分の時間感覚を優先する",
  "良い流れの後ほど冷静に区切る",
  "違和感を見過ごさず早めに切り替える",
  "結果を追うより観察を楽しむ",
  "短く区切るほど運を保ちやすい",
  "勢いより確認を一つ増やす"
];

export async function createFortune(input: {
  userId: string;
  birthDate: string;
  date: string;
  salt: string;
}): Promise<Omit<FortuneResult, "narrative">> {
  const personalNumber = reduceNumber(input.birthDate.replaceAll("-", ""));
  const dateNumber = reduceNumber(input.date.replaceAll("-", ""));
  const seed = await hashToUint32(
    `${input.userId}|${input.birthDate}|${input.date}|${input.salt}`
  );
  const random = mulberry32(seed ^ (personalNumber << 8) ^ dateNumber);

  const draw = score(random, personalNumber * 2);
  const selection = score(random, dateNumber * 2);
  const flow = score(random, personalNumber + dateNumber);
  const calmness = score(random, 12 - Math.abs(personalNumber - dateNumber), 28);
  const overall = clamp(
    Math.round(draw * 0.3 + selection * 0.25 + flow * 0.2 + calmness * 0.25),
    18,
    98
  );

  const luckyDigit = Math.floor(random() * 10);
  const firstNumber = 1 + Math.floor(random() * 99);
  let secondNumber = 1 + Math.floor(random() * 99);
  if (secondNumber === firstNumber) secondNumber = (secondNumber % 99) + 1;

  const hour = 9 + Math.floor(random() * 13);
  const luckyColor = pick(COLORS, random);
  const luckyItem = pick(ITEMS, random);
  const machineStyle = pick(MACHINE_STYLES, random);
  const theme = pick(THEMES, random);

  return {
    date: input.date,
    overall,
    rank: rankFor(overall),
    draw,
    selection,
    flow,
    calmness,
    luckyDigit,
    luckyNumbers: [firstNumber, secondNumber],
    luckyColor,
    luckyItem,
    machineStyle,
    luckyTime: `${String(hour).padStart(2, "0")}:00〜${String(hour + 1).padStart(2, "0")}:00`,
    theme
  };
}

export function fallbackNarrative(
  result: Omit<FortuneResult, "narrative">
): string {
  const entries = [
    ["引き", result.draw],
    ["台選び", result.selection],
    ["流れ", result.flow],
    ["冷静さ", result.calmness]
  ] as const;
  const high = [...entries].sort((a, b) => b[1] - a[1])[0] ?? entries[0];
  const low = [...entries].sort((a, b) => a[1] - b[1])[0] ?? entries[0];

  return `今日は${high[0]}の運が前に出やすい一方、${low[0]}は意識して補いたい日です。今日のテーマは「${result.theme}」。末尾${result.luckyDigit}は、同条件で迷ったときの遊び要素として使ってください。`;
}

function reduceNumber(value: string): number {
  let total = [...value].reduce((sum, char) => sum + Number(char), 0);
  while (total > 9) {
    total = [...String(total)].reduce((sum, char) => sum + Number(char), 0);
  }
  return Math.max(total, 1);
}

function score(random: () => number, modifier: number, minimum = 20): number {
  const base = minimum + Math.floor(random() * (100 - minimum));
  return clamp(base + ((modifier % 11) - 5), minimum, 99);
}

function rankFor(scoreValue: number): string {
  if (scoreValue >= 90) return "超強運";
  if (scoreValue >= 80) return "強運";
  if (scoreValue >= 65) return "好調";
  if (scoreValue >= 45) return "平常";
  if (scoreValue >= 30) return "慎重";
  return "休養推奨";
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error("Fortune table is empty");
  return item;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
