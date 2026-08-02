import type { FortuneAnalysis, FortuneSystemReading } from "../types";
import {
  createV2Fortune as createV5Fortune,
  type V2FortuneDraft as V5FortuneDraft
} from "./fortune-v5";
import type { FoundationAssessment } from "./types";

export const V2_ENGINE_VERSION = "v2-fortune-6";

export type V2FortuneDraft = Omit<V5FortuneDraft, "engineVersion"> & {
  engineVersion: typeof V2_ENGINE_VERSION;
};

/**
 * V6 keeps the V5 calendar calculations and annual rank, but the displayed
 * 0-100 score is now the actual weighted total of the visible components.
 * Annual percentile remains contextual information only and no longer
 * replaces the calculated score.
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
    slotSummary: scoreSummary(
      overall,
      base.analysis.scoreScale?.rankFromTop,
      base.analysis.scoreScale?.totalDays
    )
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

function scoreSummary(
  score: number,
  rankFromTop: number | undefined,
  totalDays: number | undefined
): string {
  const rankText =
    rankFromTop && totalDays
      ? `年間順位は${totalDays}日中、上位${rankFromTop}位です。`
      : "";

  if (score >= 90) {
    return `${rankText}各要素の加重合計が非常に高い日です。要するにスロットでいうと、相性が出たタイプ・メーカー・末尾を普段より素直に優先しやすい日です。`;
  }
  if (score >= 75) {
    return `${rankText}各要素の加重合計が高い日です。要するにスロットでいうと、候補を絞った後はおすすめタイプとラッキー末尾を決め手にしやすい日です。`;
  }
  if (score >= 60) {
    return `${rankText}各要素の加重合計は平均より高めです。要するにスロットでいうと、相性が出た条件へ寄せると選びやすい日です。`;
  }
  if (score >= 40) {
    return `${rankText}各要素の加重合計は中間帯です。要するにスロットでいうと、おすすめタイプ・末尾・時間帯のうち重なる条件を使う日です。`;
  }
  if (score >= 20) {
    return `${rankText}各要素の加重合計は低めです。要するにスロットでいうと、候補を広げず、相性が出た要素だけに絞って見る日です。`;
  }
  return `${rankText}各要素の加重合計がかなり低い日です。要するにスロットでいうと、ラッキータイムや末尾など限定された条件だけを拾う日です。`;
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
