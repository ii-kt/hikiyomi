import type { FortuneAnalysis, FortuneItem, FortuneSystemReading } from "../types";
import {
  createV2Fortune as createV5Fortune,
  type V2FortuneDraft as V5FortuneDraft
} from "./fortune-v5";
import type { FiveElement, FoundationAssessment, Polarity } from "./types";

export const V2_ENGINE_VERSION = "v2-fortune-8";

export type V2FortuneDraft = Omit<V5FortuneDraft, "engineVersion"> & {
  engineVersion: typeof V2_ENGINE_VERSION;
};

const LUCKY_ITEMS: Record<FiveElement, Record<Polarity, FortuneItem>> = {
  wood: {
    yang: { name: "木製キーホルダー", meaning: "木の陽が示す伸びと前進を持ち歩くお守り" },
    yin: { name: "緑のハンカチ", meaning: "木の陰が示す落ち着いた成長を身近に置くお守り" }
  },
  fire: {
    yang: { name: "赤いボールペン", meaning: "火の陽が示す勢いと決断を意識するお守り" },
    yin: { name: "赤い小物", meaning: "火の陰が示す内側の熱をそっと持つお守り" }
  },
  earth: {
    yang: { name: "コインケース", meaning: "土の陽が示す安定と蓄積を意識するお守り" },
    yin: { name: "茶色のハンカチ", meaning: "土の陰が示す落ち着きと足元の安定を表すお守り" }
  },
  metal: {
    yang: { name: "腕時計", meaning: "金の陽が示す判断と切れ味を意識するお守り" },
    yin: { name: "シルバーの小物", meaning: "金の陰が示す精密さと整いを表すお守り" }
  },
  water: {
    yang: { name: "ネイビーのタオル", meaning: "水の陽が示す流れと切り替えを意識するお守り" },
    yin: { name: "黒いイヤホン", meaning: "水の陰が示す集中と静けさを身近に置くお守り" }
  }
};

const LUCKY_DRINKS: Record<FiveElement, Record<Polarity, FortuneItem>> = {
  wood: {
    yang: { name: "緑茶", meaning: "木の陽が示す伸びやかな流れに合わせた一杯" },
    yin: { name: "ジャスミン茶", meaning: "木の陰が示す穏やかな広がりに合わせた一杯" }
  },
  fire: {
    yang: { name: "ホットコーヒー", meaning: "火の陽が示す熱と勢いに合わせた一杯" },
    yin: { name: "ルイボスティー", meaning: "火の陰が示すやわらかな熱を意識した一杯" }
  },
  earth: {
    yang: { name: "ほうじ茶", meaning: "土の陽が示す安定感に合わせた一杯" },
    yin: { name: "ミルクティー", meaning: "土の陰が示す落ち着きと包み込む感覚に合わせた一杯" }
  },
  metal: {
    yang: { name: "無糖炭酸水", meaning: "金の陽が示す切れ味と明晰さを意識した一杯" },
    yin: { name: "無糖アイスティー", meaning: "金の陰が示すすっきりした整いに合わせた一杯" }
  },
  water: {
    yang: { name: "ミネラルウォーター", meaning: "水の陽が示す流動と切り替えに合わせた一杯" },
    yin: { name: "麦茶", meaning: "水の陰が示す静かな流れに合わせた一杯" }
  }
};

/**
 * V8 keeps the V7 weighted score calculation and restores practical lucky
 * cues requested by users. Lucky item and drink are deterministic symbolic
 * mappings from the target day's five-element and polarity combination.
 */
export function createV2Fortune(
  assessment: FoundationAssessment
): V2FortuneDraft {
  const base = createV5Fortune(assessment);
  const systems = base.analysis.systems ?? [];
  const birthTimeUsed = base.analysis.birthTimeUsed === true;

  const overall = weightedOverall(systems, birthTimeUsed);
  const draw = weightedDraw(systems, birthTimeUsed);
  const element = assessment.facts.targetDay.stem.element;
  const polarity = assessment.facts.targetDay.stem.polarity;
  const analysis: FortuneAnalysis = {
    ...base.analysis,
    sourceRuleIds: [
      ...base.analysis.sourceRuleIds.filter(
        (ruleId) => ruleId !== "FINAL-SCORE-MAP-003"
      ),
      "FINAL-SCORE-MAP-004"
    ],
    slotSummary: confidenceSummary(overall, draw)
  };

  return {
    ...base,
    engineVersion: V2_ENGINE_VERSION,
    overall,
    draw,
    rank: rankFor(overall),
    luckyItem: LUCKY_ITEMS[element][polarity],
    luckyDrink: LUCKY_DRINKS[element][polarity],
    analysis
  };
}

export function fallbackV2Narrative(fortune: V2FortuneDraft): string {
  const scale = fortune.analysis.scoreScale;
  const position = scale
    ? `${scale.year}年の${scale.totalDays}日中、上位${scale.rankFromTop}位`
    : "今日の個人運";
  const item = fortune.luckyItem ? `、ラッキーアイテムは${fortune.luckyItem.name}` : "";
  const drink = fortune.luckyDrink ? `、相性ドリンクは${fortune.luckyDrink.name}` : "";

  return `${position}、各占術要素の加重合計は${fortune.overall}点です。今日は「${fortune.machineStyle.name}」と相性が出ています。相性メーカーは${fortune.compatibleManufacturers.join("／")}。ラッキー末尾は${fortune.luckyDigit}、ラッキーカラーは${fortune.luckyColor.name}${item}${drink}です。`;
}

function weightedOverall(
  systems: FortuneSystemReading[],
  birthTimeUsed: boolean
): number {
  const scores = systemScores(systems);
  const value = birthTimeUsed
    ? scores.fiveElements * 0.3 +
      scores.branches * 0.2 +
      scores.sexagenary * 0.2 +
      scores.numerology * 0.15 +
      scores.birthTime * 0.15
    : scores.fiveElements * 0.35 +
      scores.branches * 0.25 +
      scores.sexagenary * 0.25 +
      scores.numerology * 0.15;

  return clamp(Math.round(value), 0, 100);
}

function weightedDraw(
  systems: FortuneSystemReading[],
  birthTimeUsed: boolean
): number {
  const scores = systemScores(systems);
  const base =
    scores.fiveElements * 0.35 +
    scores.sexagenary * 0.25 +
    scores.branches * 0.2 +
    scores.numerology * 0.2;
  const value = birthTimeUsed ? base * 0.9 + scores.birthTime * 0.1 : base;
  return clamp(Math.round(value), 0, 100);
}

function systemScores(systems: FortuneSystemReading[]): {
  fiveElements: number;
  branches: number;
  sexagenary: number;
  numerology: number;
  birthTime: number;
} {
  return {
    fiveElements: scoreOf(systems, "five-elements"),
    branches: scoreOf(systems, "branches"),
    sexagenary: scoreOf(systems, "sexagenary"),
    numerology: scoreOf(systems, "numerology"),
    birthTime: scoreOf(systems, "birth-time", 50)
  };
}

function scoreOf(
  systems: FortuneSystemReading[],
  id: FortuneSystemReading["id"],
  fallback = 50
): number {
  return systems.find((system) => system.id === id)?.score ?? fallback;
}

function confidenceSummary(score: number, draw: number): string {
  if (score >= 90) {
    return "今日はかなり強い追い風が出ています。自分のヒキを信じて、迷わず楽しんでいい日です。";
  }
  if (score >= 75) {
    return "今日は運気がしっかり味方しています。座った台では、自分なら引けるという感覚を持って打てる日です。";
  }
  if (score >= 60) {
    return draw >= 70
      ? "今日は総合運以上にヒキが強く出ています。勝負どころでは、自分のアームを信じていい日です。"
      : "今日は流れをつかみやすい日です。決めた台では、余計に疑わず自信を持って楽しんでください。";
  }
  if (score >= 40) {
    return draw >= 60
      ? "今日は総合点は平常ですが、ヒキは悪くありません。勝負どころでは、自分のアームを信じていい日です。"
      : "今日は強い追い風こそありませんが、必要以上に弱気になる日でもありません。座った台では、自分のヒキを信じて楽しむ日です。";
  }
  if (score >= 20) {
    return draw >= 50
      ? "今日は慎重寄りですが、ヒキまで弱いわけではありません。ここぞという場面では、自分なら引けると信じてください。"
      : "今日は運気が控えめです。無理に強がるより、ラッキーカラーや末尾を味方につけて自信を整える日です。";
  }
  return "今日は運気がかなり控えめです。それでも、ラッキーカラーや末尾をお守り代わりにして、自分のペースを崩さず楽しんでください。";
}

function rankFor(score: number): string {
  if (score >= 90) return "超強運";
  if (score >= 75) return "強運";
  if (score >= 60) return "好調";
  if (score >= 40) return "平常";
  if (score >= 20) return "慎重";
  return "低調";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
