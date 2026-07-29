import type {
  FortuneAnalysis,
  FortuneItem,
  FortuneResult
} from "../types";
import type {
  FiveElement,
  FoundationAssessment,
  MetricKey,
  RuleContribution
} from "./types";

export const V2_ENGINE_VERSION = "v2-fortune-2";

type GuidanceKey = "draw" | "selection" | "flow" | "calmness";
type WeightedMetric = readonly [MetricKey, number];

export type V2FortuneDraft = Omit<FortuneResult, "narrative"> & {
  engineVersion: typeof V2_ENGINE_VERSION;
  analysis: FortuneAnalysis;
};

const SCORE_INPUTS: Record<GuidanceKey, readonly WeightedMetric[]> = {
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

const GUIDANCE_LABELS: Record<GuidanceKey, string> = {
  draw: "引き運",
  selection: "選び方の傾向",
  flow: "展開との付き合い方",
  calmness: "注意の置き方"
};

const METRIC_LABELS: Record<MetricKey, string> = {
  activity: "活動性",
  judgment: "判断軸",
  continuity: "継続性",
  adaptability: "変化対応",
  caution: "確認傾向",
  impulseControl: "区切り意識",
  concentration: "集中傾向",
  switching: "切替傾向"
};

const ELEMENT_COLORS: Record<FiveElement, FortuneItem> = {
  wood: { name: "エメラルド", meaning: "選択肢を整理し、伸ばす方向を一つに絞る色" },
  fire: { name: "朱色", meaning: "動き出す勢いを、短い区切りへ変える色" },
  earth: { name: "琥珀色", meaning: "足元の条件と予定を確認する色" },
  metal: { name: "シルバー", meaning: "余計な候補を削り、判断を明確にする色" },
  water: { name: "ネイビー", meaning: "展開を観察し、焦りを落ち着かせる色" }
};

const LOW_SCORE_ITEMS: Record<GuidanceKey, FortuneItem> = {
  draw: { name: "無糖の飲み物", meaning: "一口飲んでから動き、勢い任せを避ける合図" },
  selection: { name: "小さなメモ", meaning: "最初に決めた条件を残し、候補を増やしすぎないための道具" },
  flow: { name: "イヤホンケース", meaning: "移動や休憩の区切りを意識する目印" },
  calmness: { name: "腕時計", meaning: "経過時間を確認し、予定どおり区切るための道具" }
};

const HIGH_SCORE_STYLES: Record<GuidanceKey, FortuneItem> = {
  draw: { name: "演出を楽しめる機種", meaning: "結果だけに寄せず、今日の勢いを娯楽として扱いやすいタイプ" },
  selection: { name: "打ち慣れた機種", meaning: "既知の挙動を基準にして候補を絞りやすいタイプ" },
  flow: { name: "短時間で区切れる機種", meaning: "展開の変化を確認しながら予定を守りやすいタイプ" },
  calmness: { name: "手順を追いやすい機種", meaning: "確認する箇所を決めて遊びやすいタイプ" }
};

const MANUFACTURERS = [
  "サミー",
  "大都技研",
  "SANKYO",
  "山佐ネクスト",
  "北電子",
  "ユニバーサルエンターテインメント",
  "平和",
  "藤商事",
  "ニューギン",
  "コナミアミューズメント"
] as const;

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

  const guidanceScores: Record<GuidanceKey, number> = {
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
  const strongest = scoreExtreme(guidanceScores, "highest");
  const weakest = scoreExtreme(guidanceScores, "lowest");

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
  const compatibleManufacturers = manufacturerPair(assessment, overall);

  const analysis = createAnalysis(
    assessment,
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
    luckyColor: ELEMENT_COLORS[facts.targetDay.stem.element],
    luckyItem: LOW_SCORE_ITEMS[weakest],
    machineStyle: HIGH_SCORE_STYLES[strongest],
    compatibleManufacturers,
    luckyTime: `${String(startHour).padStart(2, "0")}:00〜${String(startHour + 1).padStart(2, "0")}:00`,
    theme: themeFor(strongest),
    caution: cautionFor(weakest),
    analysis
  };
}

export function fallbackV2Narrative(fortune: V2FortuneDraft): string {
  const factor = fortune.analysis.mainFactors[0] ?? "複数の暦要素";
  return `${factor}が今日の中心です。引き運は${fortune.draw}点。相性傾向は「${fortune.machineStyle.name}」、相性メーカーは${fortune.compatibleManufacturers.join("・")}です。${fortune.theme}ことを基準にし、${fortune.caution}。末尾${fortune.luckyDigit}は同条件で迷ったときの娯楽上の目印として扱ってください。`;
}

function finalScore(
  assessment: FoundationAssessment,
  key: GuidanceKey,
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

function manufacturerPair(
  assessment: FoundationAssessment,
  overall: number
): [string, string] {
  const facts = assessment.facts;
  const firstIndex = positiveModulo(
    facts.birthDay.index +
      facts.targetDay.index +
      facts.birthNumerology +
      Math.round(overall / 10),
    MANUFACTURERS.length
  );
  let secondIndex = positiveModulo(
    firstIndex +
      facts.targetDay.branch.index +
      facts.targetNumerology +
      1,
    MANUFACTURERS.length
  );
  if (secondIndex === firstIndex) {
    secondIndex = (secondIndex + 1) % MANUFACTURERS.length;
  }
  return [manufacturerAt(firstIndex), manufacturerAt(secondIndex)];
}

function manufacturerAt(index: number): string {
  const manufacturer = MANUFACTURERS[index];
  if (!manufacturer) throw new Error("Manufacturer table is empty");
  return manufacturer;
}

function createAnalysis(
  assessment: FoundationAssessment,
  cycleDistance: number,
  numerologyDistance: number
): FortuneAnalysis {
  const consensusValues = (Object.keys(SCORE_INPUTS) as GuidanceKey[]).map(
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

  const conflicts = (Object.keys(SCORE_INPUTS) as GuidanceKey[])
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
        "LUCKY-DERIVATION-001",
        "MANUFACTURER-DERIVATION-001"
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
  key: GuidanceKey
): number {
  const values = SCORE_INPUTS[key].map(([metric]) =>
    amplifyMetric(assessment.metrics[metric].score)
  );
  const spread = Math.max(...values) - Math.min(...values);
  return clamp(1 - spread / 75, 0.35, 0.98);
}

function scoreConflict(
  assessment: FoundationAssessment,
  key: GuidanceKey
): string | null {
  const values = SCORE_INPUTS[key].map(([metric]) => ({
    metric,
    score: amplifyMetric(assessment.metrics[metric].score)
  }));
  const high = [...values].sort((a, b) => b.score - a.score)[0];
  const low = [...values].sort((a, b) => a.score - b.score)[0];
  if (!high || !low || high.score - low.score < 15) return null;
  return `${GUIDANCE_LABELS[key]}では${METRIC_LABELS[high.metric]}と${METRIC_LABELS[low.metric]}の判定が分かれている`;
}

function scoreExtreme(
  scores: Record<GuidanceKey, number>,
  direction: "highest" | "lowest"
): GuidanceKey {
  const entries = Object.entries(scores) as Array<[GuidanceKey, number]>;
  entries.sort((a, b) =>
    direction === "highest" ? b[1] - a[1] : a[1] - b[1]
  );
  return entries[0]?.[0] ?? "calmness";
}

function themeFor(strongest: GuidanceKey): string {
  const themes: Record<GuidanceKey, string> = {
    draw: "動き出す勢いを、短い判断に使う",
    selection: "打ち慣れた基準を優先し、候補を絞る",
    flow: "変化を見たら、早めに区切り直す",
    calmness: "時間と予算の基準を崩さず進める"
  };
  return themes[strongest];
}

function cautionFor(weakest: GuidanceKey): string {
  const cautions: Record<GuidanceKey, string> = {
    draw: "反応の弱さを追いかけず、様子を見る時間を作る",
    selection: "候補を増やす前に、最初の条件をもう一度確認する",
    flow: "一つの展開を次の予兆と決めつけず、区切って見る",
    calmness: "勢いが出た後ほど、時計と予算を確認する"
  };
  return cautions[weakest];
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
