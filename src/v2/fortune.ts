import type {
  FortuneAnalysis,
  FortuneItem,
  FortuneResult
} from "../types";
import type {
  FoundationAssessment,
  MetricKey,
  RuleContribution
} from "./types";

export const V2_ENGINE_VERSION = "v2-fortune-1";

type DisplayScoreKey = "draw" | "selection" | "flow" | "calmness";
type WeightedMetric = readonly [MetricKey, number];

export type V2FortuneDraft = Omit<FortuneResult, "narrative"> & {
  engineVersion: typeof V2_ENGINE_VERSION;
  analysis: FortuneAnalysis;
};

const SCORE_INPUTS: Record<DisplayScoreKey, readonly WeightedMetric[]> = {
  draw: [
    ["activity", 0.35],
    ["adaptability", 0.3],
    ["concentration", 0.2],
    ["switching", 0.15]
  ],
  selection: [
    ["judgment", 0.4],
    ["caution", 0.25],
    ["concentration", 0.25],
    ["impulseControl", 0.1]
  ],
  flow: [
    ["continuity", 0.35],
    ["adaptability", 0.25],
    ["switching", 0.25],
    ["activity", 0.15]
  ],
  calmness: [
    ["impulseControl", 0.35],
    ["caution", 0.25],
    ["concentration", 0.25],
    ["judgment", 0.15]
  ]
};

const SCORE_LABELS: Record<DisplayScoreKey, string> = {
  draw: "引き運",
  selection: "台選び運",
  flow: "流れ運",
  calmness: "冷静さ運"
};

const METRIC_LABELS: Record<MetricKey, string> = {
  activity: "活動性",
  judgment: "判断力",
  continuity: "継続力",
  adaptability: "変化対応力",
  caution: "慎重性",
  impulseControl: "衝動抑制",
  concentration: "集中力",
  switching: "切替力"
};

const ELEMENT_COLORS: Record<string, FortuneItem> = {
  wood: { name: "エメラルド", meaning: "選択肢を整理し、伸ばす方向を一つに絞る色" },
  fire: { name: "朱色", meaning: "動き出す勢いを、短い区切りへ変える色" },
  earth: { name: "琥珀色", meaning: "足元の条件と予定を確認する色" },
  metal: { name: "シルバー", meaning: "余計な候補を削り、判断を明確にする色" },
  water: { name: "ネイビー", meaning: "流れを観察し、焦りを落ち着かせる色" }
};

const LOW_SCORE_ITEMS: Record<DisplayScoreKey, FortuneItem> = {
  draw: { name: "無糖の飲み物", meaning: "一口飲んでから動くことで、勢い任せを避ける合図" },
  selection: { name: "小さなメモ", meaning: "最初に決めた条件を残し、候補を増やしすぎないための道具" },
  flow: { name: "イヤホンケース", meaning: "移動や休憩の区切りを意識する目印" },
  calmness: { name: "腕時計", meaning: "経過時間を確認し、予定どおり区切るための道具" }
};

const HIGH_SCORE_STYLES: Record<DisplayScoreKey, FortuneItem> = {
  draw: { name: "演出を楽しめる機種", meaning: "結果だけに寄せず、今日の勢いを娯楽として扱いやすいタイプ" },
  selection: { name: "打ち慣れた機種", meaning: "既知の挙動を基準にして判断力を使いやすいタイプ" },
  flow: { name: "短時間で区切れる機種", meaning: "流れの変化を確認しながら予定を守りやすいタイプ" },
  calmness: { name: "手順を追いやすい機種", meaning: "落ち着いて確認する今日の強みを使いやすいタイプ" }
};

export function createV2Fortune(
  assessment: FoundationAssessment
): V2FortuneDraft {
  const facts = assessment.facts;
  const cycleDistance = circularDistance(
    facts.birthDay.index,
    facts.targetDay.index,
    60
  );
  const branchDistance = circularDistance(
    facts.birthDay.branch.index,
    facts.targetDay.branch.index,
    12
  );
  const numerologyDistance = circularDistance(
    facts.birthNumerology - 1,
    facts.targetNumerology - 1,
    9
  );

  const draw = finalScore(
    assessment,
    "draw",
    cycleWave(cycleDistance, 0) +
      (facts.birthDay.stem.polarity === facts.targetDay.stem.polarity ? 2 : -2)
  );
  const selection = finalScore(
    assessment,
    "selection",
    cycleWave(cycleDistance, 15) + numerologyCompatibility(numerologyDistance)
  );
  const flow = finalScore(
    assessment,
    "flow",
    cycleWave(cycleDistance, 30) +
      (branchDistance <= 2 ? 4 : branchDistance >= 5 ? -3 : 0)
  );
  const calmness = finalScore(
    assessment,
    "calmness",
    cycleWave(cycleDistance, 45) +
      numerologyCompatibility(numerologyDistance) +
      birthTimePolarityAdjustment(assessment)
  );

  const displayScores: Record<DisplayScoreKey, number> = {
    draw,
    selection,
    flow,
    calmness
  };
  const overall = clamp(
    Math.round(draw * 0.3 + selection * 0.25 + flow * 0.2 + calmness * 0.25),
    20,
    95
  );
  const strongest = scoreExtreme(displayScores, "highest");
  const weakest = scoreExtreme(displayScores, "lowest");

  const luckyDigit = positiveModulo(
    facts.birthNumerology +
      facts.targetNumerology +
      facts.targetDay.branch.index +
      Math.round(overall / 10),
    10
  );
  const firstNumber = positiveModulo(facts.targetDay.index + 1, 60) || 60;
  let secondNumber =
    positiveModulo(
      facts.birthDay.index +
        facts.targetDay.index +
        draw +
        selection +
        flow +
        calmness,
      99
    ) + 1;
  if (secondNumber === firstNumber) secondNumber = (secondNumber % 99) + 1;

  const startHour =
    9 +
    positiveModulo(
      facts.targetDay.branch.index +
        (facts.birthHourBranch?.index ?? facts.birthNumerology),
      12
    );

  const analysis = createAnalysis(
    assessment,
    displayScores,
    cycleDistance,
    numerologyDistance
  );

  return {
    engineVersion: V2_ENGINE_VERSION,
    date: facts.targetDate,
    overall,
    rank: rankFor(overall),
    draw,
    selection,
    flow,
    calmness,
    luckyDigit,
    luckyNumbers: [firstNumber, secondNumber],
    luckyColor:
      ELEMENT_COLORS[facts.targetDay.stem.element] ?? ELEMENT_COLORS.water,
    luckyItem: LOW_SCORE_ITEMS[weakest],
    machineStyle: HIGH_SCORE_STYLES[strongest],
    luckyTime: `${String(startHour).padStart(2, "0")}:00〜${String(startHour + 1).padStart(2, "0")}:00`,
    theme: themeFor(strongest, weakest),
    analysis
  };
}

export function fallbackV2Narrative(fortune: V2FortuneDraft): string {
  const scores: Record<DisplayScoreKey, number> = {
    draw: fortune.draw,
    selection: fortune.selection,
    flow: fortune.flow,
    calmness: fortune.calmness
  };
  const strongest = scoreExtreme(scores, "highest");
  const weakest = scoreExtreme(scores, "lowest");
  const factor = fortune.analysis.mainFactors[0] ?? "複数の暦要素";
  const conflict = fortune.analysis.conflicts[0];

  return `${factor}が今日の中心です。${SCORE_LABELS[strongest]}は使いやすい一方、${SCORE_LABELS[weakest]}は意識して補う余地があります。${fortune.theme}ことを基準にし、末尾${fortune.luckyDigit}は同条件で迷ったときの娯楽上の目印として扱ってください。${conflict ? `なお、${conflict}ため、一つの勢いだけで決めない日です。` : ""}`;
}

function finalScore(
  assessment: FoundationAssessment,
  key: DisplayScoreKey,
  calendarAdjustment: number
): number {
  const blended = SCORE_INPUTS[key].reduce((sum, [metric, weight]) => {
    const score = assessment.metrics[metric].score;
    return sum + amplifyMetric(score) * weight;
  }, 0);

  return clamp(Math.round(blended + calendarAdjustment), 20, 95);
}

function amplifyMetric(score: number): number {
  return clamp(47 + (score - 50) * 5, 20, 95);
}

function cycleWave(distance: number, phase: number): number {
  return Math.round(Math.cos(((distance + phase) / 60) * Math.PI * 2) * 8);
}

function numerologyCompatibility(distance: number): number {
  return clamp(4 - distance * 2, -4, 4);
}

function birthTimePolarityAdjustment(
  assessment: FoundationAssessment
): number {
  const birthHour = assessment.facts.birthHourBranch;
  if (!birthHour) return 0;
  return birthHour.polarity === assessment.facts.targetDay.branch.polarity ? 2 : -1;
}

function createAnalysis(
  assessment: FoundationAssessment,
  displayScores: Record<DisplayScoreKey, number>,
  cycleDistance: number,
  numerologyDistance: number
): FortuneAnalysis {
  const consensusValues = (Object.keys(SCORE_INPUTS) as DisplayScoreKey[]).map(
    (key) => scoreConsensus(assessment, key)
  );
  const consensus = round2(
    consensusValues.reduce((sum, value) => sum + value, 0) /
      consensusValues.length
  );
  const nonVariation = assessment.contributions.filter(
    (item) => item.kind !== "deterministic-variation"
  );

  const confidence: FortuneAnalysis["confidence"] =
    assessment.facts.birthTimeKnown && nonVariation.length >= 4 && consensus >= 0.72
      ? "high"
      : nonVariation.length >= 3
        ? "medium"
        : "low";

  const contributionFactors = topContributionFactors(assessment.contributions);
  const mainFactors = [
    `出生日と対象日の六十干支距離 ${cycleDistance}/60`,
    `本命数${assessment.facts.birthNumerology}と対象日数${assessment.facts.targetNumerology}の距離 ${numerologyDistance}/9`,
    ...contributionFactors
  ].slice(0, 3);

  const conflicts = (Object.keys(SCORE_INPUTS) as DisplayScoreKey[])
    .map((key) => scoreConflict(assessment, key))
    .filter((value): value is string => Boolean(value));

  return {
    assessmentVersion: assessment.version,
    confidence,
    consensus,
    mainFactors,
    conflicts,
    sourceRuleIds: [
      ...new Set([
        ...assessment.contributions.map((item) => item.ruleId),
        "FINAL-SCORE-MAP-001",
        "LUCKY-DERIVATION-001"
      ])
    ],
    sourceIds: [...new Set([...assessment.sourceIds, "HIKIYOMI-METHOD-001"])]
  };
}

function topContributionFactors(
  contributions: RuleContribution[]
): string[] {
  const ordered = [...contributions].sort(
    (a, b) =>
      Number(a.kind === "deterministic-variation") -
        Number(b.kind === "deterministic-variation") ||
      Math.abs(b.delta) - Math.abs(a.delta)
  );
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of ordered) {
    const key = `${item.ruleId}:${item.metric}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(
      `${localizeBasis(item.basis)}（${METRIC_LABELS[item.metric]} ${formatDelta(item.delta)}）`
    );
    if (output.length >= 3) break;
  }

  return output;
}

function scoreConsensus(
  assessment: FoundationAssessment,
  key: DisplayScoreKey
): number {
  const values = SCORE_INPUTS[key].map(([metric]) =>
    amplifyMetric(assessment.metrics[metric].score)
  );
  const spread = Math.max(...values) - Math.min(...values);
  return clamp(1 - spread / 75, 0.35, 0.98);
}

function scoreConflict(
  assessment: FoundationAssessment,
  key: DisplayScoreKey
): string | null {
  const values = SCORE_INPUTS[key].map(([metric]) => ({
    metric,
    score: amplifyMetric(assessment.metrics[metric].score)
  }));
  const high = [...values].sort((a, b) => b.score - a.score)[0];
  const low = [...values].sort((a, b) => a.score - b.score)[0];
  if (!high || !low || high.score - low.score < 15) return null;
  return `${SCORE_LABELS[key]}では${METRIC_LABELS[high.metric]}と${METRIC_LABELS[low.metric]}の判定が分かれている`;
}

function scoreExtreme(
  scores: Record<DisplayScoreKey, number>,
  direction: "highest" | "lowest"
): DisplayScoreKey {
  const entries = Object.entries(scores) as Array<[DisplayScoreKey, number]>;
  entries.sort((a, b) =>
    direction === "highest" ? b[1] - a[1] : a[1] - b[1]
  );
  return entries[0]?.[0] ?? "calmness";
}

function themeFor(
  strongest: DisplayScoreKey,
  weakest: DisplayScoreKey
): string {
  const strongText: Record<DisplayScoreKey, string> = {
    draw: "動き出す勢いを短い判断に使う",
    selection: "最初に決めた条件を判断軸にする",
    flow: "変化を見たら早めに区切り直す",
    calmness: "時間と予算の基準を崩さない"
  };
  const weakText: Record<DisplayScoreKey, string> = {
    draw: "反応の弱さを追いかけず様子を見る",
    selection: "候補を増やす前に条件を確認する",
    flow: "一つの展開を次の予兆と決めつけない",
    calmness: "勢いが出た後ほど時計を見る"
  };
  return `${strongText[strongest]}。同時に、${weakText[weakest]}`;
}

function rankFor(score: number): string {
  if (score >= 78) return "超強運";
  if (score >= 66) return "強運";
  if (score >= 56) return "好調";
  if (score >= 44) return "平常";
  if (score >= 34) return "慎重";
  return "休養推奨";
}

function circularDistance(a: number, b: number, size: number): number {
  const raw = Math.abs(a - b) % size;
  return Math.min(raw, size - raw);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function formatDelta(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function localizeBasis(value: string): string {
  return value
    .replaceAll("wood", "木")
    .replaceAll("fire", "火")
    .replaceAll("earth", "土")
    .replaceAll("metal", "金")
    .replaceAll("water", "水");
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
