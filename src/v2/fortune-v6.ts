import type { FortuneAnalysis, FortuneSystemReading } from "../types";
import {
  createV2Fortune as createV5Fortune,
  type V2FortuneDraft as V5FortuneDraft
} from "./fortune-v5";
import type { FoundationAssessment } from "./types";

export const V2_ENGINE_VERSION = "v2-fortune-7";

export type V2FortuneDraft = Omit<V5FortuneDraft, "engineVersion"> & {
  engineVersion: typeof V2_ENGINE_VERSION;
};

/**
 * V7 keeps the V6 weighted score calculation. The user-facing summary is
 * rewritten as a short confidence cue for slot players instead of repeating
 * the scoring formula or giving abstract selection instructions.
 */
export function createV2Fortune(
  assessment: FoundationAssessment
): V2FortuneDraft {
  const base = createV5Fortune(assessment);
  const systems = base.analysis.systems ?? [];
  const birthTimeUsed = base.analysis.birthTimeUsed === true;

  const overall = weightedOverall(systems, birthTimeUsed);
  const draw = weightedDraw(systems, birthTimeUsed);
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
    analysis
  };
}

export function fallbackV2Narrative(fortune: V2FortuneDraft): string {
  const scale = fortune.analysis.scoreScale;
  const position = scale
    ? `${scale.year}年の${scale.totalDays}日中、上位${scale.rankFromTop}位`
    : "今日の個人運";

  return `${position}、各占術要素の加重合計は${fortune.overall}点です。今日は「${fortune.machineStyle.name}」と相性が出ています。相性メーカーは${fortune.compatibleManufacturers.join("／")}。ラッキー末尾は${fortune.luckyDigit}、ラッキーカラーは${fortune.luckyColor.name}です。`;
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
