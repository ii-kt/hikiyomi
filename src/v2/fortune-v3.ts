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

export const V2_ENGINE_VERSION = "v2-fortune-3";

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
  wood: { name: "エメラルド", meaning: "木の象徴である成長と整理を意識する色" },
  fire: { name: "朱色", meaning: "火の象徴である勢いを短い区切りへ変える色" },
  earth: { name: "琥珀色", meaning: "土の象徴である安定と足元の確認を意識する色" },
  metal: { name: "シルバー", meaning: "金の象徴である選別と明確さを意識する色" },
  water: { name: "ネイビー", meaning: "水の象徴である観察と柔軟さを意識する色" }
};

const LOW_SCORE_ITEMS: Record<GuidanceKey, FortuneItem> = {
  draw: { name: "無糖の飲み物", meaning: "一口飲んでから動き、勢いだけで決めないための合図" },
  selection: { name: "小さなメモ", meaning: "開始前に決めた条件を残しておくための道具" },
  flow: { name: "イヤホンケース", meaning: "移動や休憩の区切りを意識する目印" },
  calmness: { name: "腕時計", meaning: "終了時刻と休憩時刻を確認するための道具" }
};

const SLOT_TYPES: Record<FiveElement, Record<Polarity, FortuneItem>> = {
  wood: {
    yang: {
      name: "スマスロAT機",
      meaning: "木の陽の『伸びる動き』を、展開変化の大きいタイプへ置き換えた占い上の候補"
    },
    yin: {
      name: "Aタイプ",
      meaning: "木の陰の『整えて育てる』象徴を、区切りを見やすいタイプへ置き換えた占い上の候補"
    }
  },
  fire: {
    yang: {
      name: "スマスロAT機",
      meaning: "火の陽の『強い動き』を、展開変化の大きいタイプへ置き換えた占い上の候補"
    },
    yin: {
      name: "AT機",
      meaning: "火の陰の『集中した熱』を、展開を追うタイプへ置き換えた占い上の候補"
    }
  },
  earth: {
    yang: {
      name: "メダルAT機",
      meaning: "土の陽の『安定した進行』を、手順を追いやすいタイプへ置き換えた占い上の候補"
    },
    yin: {
      name: "Aタイプ",
      meaning: "土の陰の『落ち着き』を、区切りを見やすいタイプへ置き換えた占い上の候補"
    }
  },
  metal: {
    yang: {
      name: "AT機",
      meaning: "金の陽の『選別と決断』を、展開を見て区切るタイプへ置き換えた占い上の候補"
    },
    yin: {
      name: "Aタイプ",
      meaning: "金の陰の『精密さ』を、判断材料を確認しやすいタイプへ置き換えた占い上の候補"
    }
  },
  water: {
    yang: {
      name: "スマスロAT機",
      meaning: "水の陽の『大きな流動』を、展開変化の大きいタイプへ置き換えた占い上の候補"
    },
    yin: {
      name: "メダルAT機",
      meaning: "水の陰の『観察と適応』を、変化を追いやすいタイプへ置き換えた占い上の候補"
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

const SAFE_GUIDANCE = [
  {
    theme: "始める前に終了時刻を決める",
    caution: "予定時刻を過ぎたら、結果に関係なく一度席を離れる"
  },
  {
    theme: "使う上限を先に決める",
    caution: "取り返す目的で、決めた上限を増やさない"
  },
  {
    theme: "一定時間ごとに休憩を入れる",
    caution: "展開が続いていても、時計を確認して区切る"
  },
  {
    theme: "候補を絞ってから座る",
    caution: "迷ったときは候補を増やさず、見送る選択も残す"
  }
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
      facts.targetDay.branch.index + facts.birthNumerology,
      12
    );
  const guidance = guidanceFor(assessment);

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
    machineStyle:
      SLOT_TYPES[facts.targetDay.stem.element][facts.targetDay.stem.polarity],
    compatibleManufacturers: manufacturerPair(assessment, overall),
    luckyTime: `${String(startHour).padStart(2, "0")}:00〜${String(startHour + 1).padStart(2, "0")}:00`,
    theme: guidance.theme,
    caution: guidance.caution,
    analysis: createAnalysis(
      assessment,
      guidanceScores,
      cycleDistance,
      numerologyDistance
    )
  };
}

export function fallbackV2Narrative(fortune: V2FortuneDraft): string {
  return `今日は「${fortune.machineStyle.name}」が占い上の相性候補です。相性メーカーは${fortune.compatibleManufacturers.join("／")}、ラッキー末尾は${fortune.luckyDigit}。${fortune.theme}。${fortune.caution}。`;
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

function guidanceFor(
  assessment: FoundationAssessment
): (typeof SAFE_GUIDANCE)[number] {
  const index = positiveModulo(
    assessment.facts.targetDay.branch.index +
      assessment.facts.targetNumerology,
    SAFE_GUIDANCE.length
  );
  return SAFE_GUIDANCE[index] ?? SAFE_GUIDANCE[0];
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
        "MANUFACTURER-DERIVATION-001",
        "SAFE-GUIDANCE-001"
      ])
    ],
    sourceIds: [
      ...new Set([
        ...assessment.sourceIds,
        "WHO-GAMBLING-001",
        "HIKIYOMI-METHOD-001"
      ])
    ]
  };
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
