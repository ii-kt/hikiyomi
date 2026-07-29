import type {
  FortuneAnalysis,
  FortuneItem,
  FortuneResult
} from "../types";
import type {
  FiveElement,
  FoundationAssessment,
  MetricKey,
  Polarity
} from "./types";

export const V2_ENGINE_VERSION = "v2-fortune-4";

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

const ELEMENT_COLORS: Record<FiveElement, FortuneItem> = {
  wood: { name: "エメラルド", meaning: "木の象徴である成長と広がりを表す色" },
  fire: { name: "朱色", meaning: "火の象徴である情熱と勢いを表す色" },
  earth: { name: "琥珀色", meaning: "土の象徴である安定と蓄積を表す色" },
  metal: { name: "シルバー", meaning: "金の象徴である明晰さと決断を表す色" },
  water: { name: "ネイビー", meaning: "水の象徴である流動と洞察を表す色" }
};

const SLOT_TYPES: Record<FiveElement, Record<Polarity, FortuneItem>> = {
  wood: {
    yang: {
      name: "スマスロAT機",
      meaning: "木の陽が示す伸長と展開力を、変化の大きいタイプへ対応させた候補"
    },
    yin: {
      name: "Aタイプ",
      meaning: "木の陰が示す育成と積み重ねを、刻みの見えやすいタイプへ対応させた候補"
    }
  },
  fire: {
    yang: {
      name: "スマスロAT機",
      meaning: "火の陽が示す強い上昇力を、展開の大きいタイプへ対応させた候補"
    },
    yin: {
      name: "AT機",
      meaning: "火の陰が示す内側の熱量を、展開を追うタイプへ対応させた候補"
    }
  },
  earth: {
    yang: {
      name: "メダルAT機",
      meaning: "土の陽が示す持続と安定を、進行を追いやすいタイプへ対応させた候補"
    },
    yin: {
      name: "Aタイプ",
      meaning: "土の陰が示す静かな蓄積を、刻みの見えやすいタイプへ対応させた候補"
    }
  },
  metal: {
    yang: {
      name: "AT機",
      meaning: "金の陽が示す決断と切れ味を、展開を見極めるタイプへ対応させた候補"
    },
    yin: {
      name: "Aタイプ",
      meaning: "金の陰が示す精密さを、細かな変化を捉えやすいタイプへ対応させた候補"
    }
  },
  water: {
    yang: {
      name: "スマスロAT機",
      meaning: "水の陽が示す大きな流動を、展開変化の大きいタイプへ対応させた候補"
    },
    yin: {
      name: "メダルAT機",
      meaning: "水の陰が示す観察と適応を、変化を追いやすいタイプへ対応させた候補"
    }
  }
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
    polarityAdjustment(
      facts.birthDay.stem.polarity,
      facts.targetDay.stem.polarity
    )
  );
  const selection = finalScore(
    assessment,
    "selection",
    numerologyCompatibility(numerologyDistance)
  );
  const flow = finalScore(
    assessment,
    "flow",
    branchDistance === 0 ? 4 : branchDistance <= 2 ? 2 : branchDistance >= 5 ? -2 : 0
  );
  const calmness = finalScore(
    assessment,
    "calmness",
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
      facts.targetDay.branch.index + facts.birthNumerology,
      12
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
    machineStyle:
      SLOT_TYPES[facts.targetDay.stem.element][facts.targetDay.stem.polarity],
    compatibleManufacturers: manufacturerPair(assessment, overall),
    luckyTime: `${String(startHour).padStart(2, "0")}:00〜${String(startHour + 1).padStart(2, "0")}:00`,
    analysis: createAnalysis(
      assessment,
      guidanceScores,
      cycleDistance,
      numerologyDistance
    )
  };
}

export function fallbackV2Narrative(fortune: V2FortuneDraft): string {
  return `今日は「${fortune.machineStyle.name}」と相性が出ています。相性メーカーは${fortune.compatibleManufacturers.join("／")}。ラッキー末尾は${fortune.luckyDigit}、ラッキーカラーは${fortune.luckyColor.name}です。`;
}

function finalScore(
  assessment: FoundationAssessment,
  key: GuidanceKey,
  calendarAdjustment: number
): number {
  const blended = SCORE_INPUTS[key].reduce((sum, [metric, weight]) => {
    return sum + amplifyMetric(metricScore(assessment, metric)) * weight;
  }, 0);

  return clamp(Math.round(blended + calendarAdjustment), 20, 95);
}

function metricScore(
  assessment: FoundationAssessment,
  metric: MetricKey
): number {
  const base = assessment.metrics[metric].base;
  const delta = assessment.contributions
    .filter(
      (item) =>
        item.metric === metric && item.kind !== "deterministic-variation"
    )
    .reduce((sum, item) => sum + item.delta, 0);
  return clamp(base + delta, 20, 95);
}

function amplifyMetric(score: number): number {
  return clamp(47 + (score - 50) * 5, 20, 95);
}

function polarityAdjustment(a: Polarity, b: Polarity): number {
  return a === b ? 2 : -1;
}

function numerologyCompatibility(distance: number): number {
  return clamp(4 - distance * 2, -4, 4);
}

function birthTimePolarityAdjustment(
  assessment: FoundationAssessment
): number {
  const birthHour = assessment.facts.birthHourBranch;
  if (!birthHour) return 0;
  return birthHour.polarity === assessment.facts.targetDay.branch.polarity ? 1 : -1;
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
  scores: Record<GuidanceKey, number>,
  cycleDistance: number,
  numerologyDistance: number
): FortuneAnalysis {
  const scoreValues = Object.values(scores);
  const spread = Math.max(...scoreValues) - Math.min(...scoreValues);
  const consensus = round2(clamp(1 - spread / 75, 0.35, 0.98));
  const nonVariation = assessment.contributions.filter(
    (item) => item.kind !== "deterministic-variation"
  );
  const confidence: FortuneAnalysis["confidence"] =
    assessment.facts.birthTimeKnown && nonVariation.length >= 4
      ? "high"
      : nonVariation.length >= 3
        ? "medium"
        : "low";

  return {
    assessmentVersion: assessment.version,
    confidence,
    consensus,
    mainFactors: [
      `対象日の干支 ${assessment.facts.targetDay.label}`,
      `出生日と対象日の六十干支距離 ${cycleDistance}/60`,
      `本命数${assessment.facts.birthNumerology}と対象日数${assessment.facts.targetNumerology}の距離 ${numerologyDistance}/9`
    ],
    conflicts: [],
    sourceRuleIds: [
      ...new Set([
        ...nonVariation.map((item) => item.ruleId),
        "FINAL-SCORE-MAP-002",
        "SLOT-TYPE-SYMBOLIC-001",
        "LUCKY-DERIVATION-001",
        "MANUFACTURER-DERIVATION-001"
      ])
    ],
    sourceIds: [
      ...new Set([
        ...assessment.sourceIds,
        "HIKIYOMI-METHOD-001"
      ])
    ]
  };
}

function rankFor(score: number): string {
  if (score >= 78) return "超強運";
  if (score >= 66) return "強運";
  if (score >= 56) return "好調";
  if (score >= 44) return "平常";
  if (score >= 34) return "慎重";
  return "低調";
}

function circularDistance(a: number, b: number, size: number): number {
  const raw = Math.abs(a - b) % size;
  return Math.min(raw, size - raw);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
