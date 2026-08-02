import type {
  FortuneAnalysis,
  FortuneItem,
  FortuneResult,
  FortuneScoreScale,
  FortuneSystemReading
} from "../types";
import {
  elementGenerates,
  getSexagenaryDay,
  reduceNumerology
} from "./calendar";
import type {
  BranchInfo,
  CalendarFacts,
  FiveElement,
  FoundationAssessment,
  Polarity
} from "./types";

export const V2_ENGINE_VERSION = "v2-fortune-5";

export type V2FortuneDraft = Omit<FortuneResult, "narrative"> & {
  engineVersion: typeof V2_ENGINE_VERSION;
  analysis: FortuneAnalysis;
};

interface DailyScore {
  date: string;
  overallRaw: number;
  drawRaw: number;
  components: ScoreComponents;
}

interface ScoreComponents {
  fiveElements: number;
  branches: number;
  sexagenary: number;
  numerology: number;
  birthTime: number | null;
  overallRaw: number;
  drawRaw: number;
}

interface AnnualScaleResult {
  overall: FortuneScoreScale;
  draw: FortuneScoreScale;
}

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
  const current = scoreForDate(facts, facts.targetDate);
  const annualScale = annualPercentileScale(facts);

  const overall = annualScale.overall.percentile;
  const draw = annualScale.draw.percentile;
  const selection = clamp(
    Math.round(current.components.numerology * 0.55 + current.components.branches * 0.45),
    0,
    100
  );
  const flow = clamp(
    Math.round(current.components.sexagenary * 0.6 + current.components.branches * 0.4),
    0,
    100
  );
  const calmness = clamp(
    Math.round(
      current.components.fiveElements * 0.6 +
        (current.components.birthTime ?? 50) * 0.4
    ),
    0,
    100
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
        overall +
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
      facts.targetDay.branch.index + facts.birthNumerology + Math.round(overall / 20),
      12
    );

  const systems = createSystemReadings(facts, current.components);
  const analysis = createAnalysis(
    assessment,
    annualScale.overall,
    systems
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
    compatibleManufacturers: manufacturerPair(facts, overall),
    luckyTime: `${String(startHour).padStart(2, "0")}:00〜${String(
      startHour + 1
    ).padStart(2, "0")}:00`,
    analysis
  };
}

export function fallbackV2Narrative(fortune: V2FortuneDraft): string {
  const scale = fortune.analysis.scoreScale;
  const position = scale
    ? `${scale.year}年の${scale.totalDays}日中、上位${scale.rankFromTop}位`
    : "今日の個人運";

  return `${position}の${fortune.overall}点です。今日は「${fortune.machineStyle.name}」と相性が出ています。相性メーカーは${fortune.compatibleManufacturers.join("／")}。ラッキー末尾は${fortune.luckyDigit}、ラッキーカラーは${fortune.luckyColor.name}です。`;
}

function annualPercentileScale(facts: CalendarFacts): AnnualScaleResult {
  const year = Number(facts.targetDate.slice(0, 4));
  const entries: DailyScore[] = [];

  for (const date of datesInYear(year)) {
    entries.push(scoreForDate(facts, date));
  }

  return {
    overall: percentileFor(entries, facts.targetDate, "overallRaw", year),
    draw: percentileFor(entries, facts.targetDate, "drawRaw", year)
  };
}

function percentileFor(
  entries: DailyScore[],
  targetDate: string,
  key: "overallRaw" | "drawRaw",
  year: number
): FortuneScoreScale {
  const sorted = [...entries].sort((a, b) => {
    const difference = a[key] - b[key];
    return difference !== 0 ? difference : a.date.localeCompare(b.date);
  });
  const index = sorted.findIndex((item) => item.date === targetDate);
  if (index < 0) throw new Error("target date is missing from annual score scale");

  const target = sorted[index];
  if (!target) throw new Error("target annual score is unavailable");
  const totalDays = sorted.length;
  const percentile =
    totalDays <= 1 ? 50 : Math.round((index * 100) / (totalDays - 1));

  return {
    kind: "annual-percentile",
    year,
    raw: round2(target[key]),
    percentile,
    rankFromTop: totalDays - index,
    totalDays
  };
}

function scoreForDate(facts: CalendarFacts, targetDate: string): DailyScore {
  const targetDay = getSexagenaryDay(targetDate);
  const targetNumerology = reduceNumerology(targetDate);
  const fiveElements = fiveElementAffinity(
    facts.birthDay.stem.element,
    facts.birthDay.stem.polarity,
    targetDay.stem.element,
    targetDay.stem.polarity
  );
  const branches = branchAffinity(facts.birthDay.branch, targetDay.branch);
  const sexagenary = cycleAffinity(
    circularDistance(facts.birthDay.index, targetDay.index, 60),
    30
  );
  const numerology = cycleAffinity(
    circularDistance(facts.birthNumerology - 1, targetNumerology - 1, 9),
    4
  );
  const birthTime = facts.birthHourBranch
    ? branchAffinity(facts.birthHourBranch, targetDay.branch)
    : null;

  const overallRaw =
    birthTime === null
      ? fiveElements * 0.35 +
        branches * 0.25 +
        sexagenary * 0.25 +
        numerology * 0.15
      : fiveElements * 0.3 +
        branches * 0.2 +
        sexagenary * 0.2 +
        numerology * 0.15 +
        birthTime * 0.15;

  const drawBase =
    fiveElements * 0.35 +
    sexagenary * 0.25 +
    branches * 0.2 +
    numerology * 0.2;
  const drawRaw =
    birthTime === null ? drawBase : drawBase * 0.9 + birthTime * 0.1;

  const tie = stableUnit(
    `${facts.birthDate}|${facts.birthHourBranch?.index ?? "unknown"}|${targetDate}`
  );

  return {
    date: targetDate,
    overallRaw: overallRaw + tie / 10_000,
    drawRaw: drawRaw + (1 - tie) / 10_000,
    components: {
      fiveElements,
      branches,
      sexagenary,
      numerology,
      birthTime,
      overallRaw: round2(overallRaw),
      drawRaw: round2(drawRaw)
    }
  };
}

function createSystemReadings(
  facts: CalendarFacts,
  scores: ScoreComponents
): FortuneSystemReading[] {
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

  const readings: FortuneSystemReading[] = [
    {
      id: "sexagenary",
      label: "六十干支の巡り",
      score: scores.sexagenary,
      basis: `出生日の${facts.birthDay.label}と対象日の${facts.targetDay.label}は、60日周期上で${cycleDistance}段離れています。`,
      slotTranslation: slotTranslation(
        scores.sexagenary,
        "展開の波をつかみやすい",
        "展開が読みにくく、相性要素を絞りたい"
      ),
      sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"]
    },
    {
      id: "five-elements",
      label: "五行・陰陽",
      score: scores.fiveElements,
      basis: `出生日干は${facts.birthDay.stem.kanji}（${elementLabel(
        facts.birthDay.stem.element
      )}・${polarityLabel(
        facts.birthDay.stem.polarity
      )}）、対象日干は${facts.targetDay.stem.kanji}（${elementLabel(
        facts.targetDay.stem.element
      )}・${polarityLabel(facts.targetDay.stem.polarity)}）です。`,
      slotTranslation: slotTranslation(
        scores.fiveElements,
        "おすすめタイプとの噛み合いが強い",
        "タイプ相性より末尾や時間帯を優先したい"
      ),
      sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"]
    },
    {
      id: "branches",
      label: "十二支の巡り",
      score: scores.branches,
      basis: `出生日支${facts.birthDay.branch.kanji}と対象日支${facts.targetDay.branch.kanji}の12周期上の距離は${branchDistance}です。`,
      slotTranslation: slotTranslation(
        scores.branches,
        "台候補を絞った後の直感を通しやすい",
        "候補を広げすぎず、相性が出た条件に寄せたい"
      ),
      sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"]
    },
    {
      id: "numerology",
      label: "生年月日と対象日の数理",
      score: scores.numerology,
      basis: `生年月日の縮約数は${facts.birthNumerology}、対象日の縮約数は${facts.targetNumerology}で、9周期上の距離は${numerologyDistance}です。`,
      slotTranslation: slotTranslation(
        scores.numerology,
        "ラッキー末尾を判断材料にしやすい",
        "数字だけで決めず、タイプや時間帯と組み合わせたい"
      ),
      sourceIds: ["HIKIYOMI-METHOD-001"]
    }
  ];

  if (facts.birthHourBranch && scores.birthTime !== null) {
    const hourDistance = circularDistance(
      facts.birthHourBranch.index,
      facts.targetDay.branch.index,
      12
    );
    readings.push({
      id: "birth-time",
      label: "出生時刻の時支",
      score: scores.birthTime,
      basis: `出生時刻は${facts.birthHourBranch.kanji}の刻として扱い、対象日支との12周期上の距離は${hourDistance}です。`,
      slotTranslation: slotTranslation(
        scores.birthTime,
        "時間帯との相性が出やすい",
        "ラッキータイムを補助的に使いたい"
      ),
      sourceIds: ["NAOJ-JUNISHI-TIME-001", "HIKIYOMI-METHOD-001"]
    });
  }

  return readings;
}

function createAnalysis(
  assessment: FoundationAssessment,
  scoreScale: FortuneScoreScale,
  systems: FortuneSystemReading[]
): FortuneAnalysis {
  const scoreValues = systems.map((item) => item.score);
  const spread = Math.max(...scoreValues) - Math.min(...scoreValues);
  const consensus = round2(clamp(1 - spread / 100, 0.2, 0.98));
  const topPercent = Math.max(
    1,
    Math.ceil((scoreScale.rankFromTop / scoreScale.totalDays) * 100)
  );

  return {
    assessmentVersion: assessment.version,
    confidence: assessment.facts.birthTimeKnown ? "high" : "medium",
    consensus,
    mainFactors: systems.map((item) => item.basis),
    conflicts: systems
      .filter((item) => item.score <= 20)
      .map((item) => `${item.label}は低めの判定`),
    sourceRuleIds: [
      "ANNUAL-PERCENTILE-SCALE-001",
      "FINAL-SCORE-MAP-003",
      "SLOT-TYPE-SYMBOLIC-001",
      "LUCKY-DERIVATION-001",
      "MANUFACTURER-DERIVATION-001"
    ],
    sourceIds: [
      ...new Set([
        ...assessment.sourceIds,
        ...systems.flatMap((item) => item.sourceIds),
        "HIKIYOMI-METHOD-001"
      ])
    ],
    scoreScale,
    systems,
    slotSummary: slotSummary(scoreScale.percentile, topPercent),
    birthTimeUsed: assessment.facts.birthTimeKnown
  };
}

function slotSummary(score: number, topPercent: number): string {
  if (score >= 90) {
    return `今年のあなたの中で上位${topPercent}%に入る強い日です。要するにスロットでいうと、今日は相性が出たタイプ・メーカー・末尾を普段より素直に優先しやすい日です。`;
  }
  if (score >= 75) {
    return `今年のあなたの中で上位${topPercent}%の好位置です。要するにスロットでいうと、候補を絞った後はおすすめタイプとラッキー末尾を決め手にしやすい日です。`;
  }
  if (score >= 60) {
    return `平均より上の流れです。要するにスロットでいうと、何でも良い日ではありませんが、相性が出た条件へ寄せると選びやすい日です。`;
  }
  if (score >= 40) {
    return `今年の中では中央付近の一日です。要するにスロットでいうと、総合点だけで判断せず、おすすめタイプ・末尾・時間帯のうち重なる条件を使う日です。`;
  }
  if (score >= 20) {
    return `今年の中では低めの位置です。要するにスロットでいうと、候補を広げず、相性が出た要素だけに絞って見る日です。`;
  }
  return `今年の中でもかなり低い位置です。要するにスロットでいうと、今日は万能な相性ではなく、ラッキータイムや末尾など限定された条件だけを拾う日です。`;
}

function fiveElementAffinity(
  birthElement: FiveElement,
  birthPolarity: Polarity,
  targetElement: FiveElement,
  targetPolarity: Polarity
): number {
  if (birthElement === targetElement) {
    return birthPolarity === targetPolarity ? 96 : 84;
  }
  if (elementGenerates(birthElement, targetElement)) return 92;
  if (elementGenerates(targetElement, birthElement)) return 76;
  if (elementControls(birthElement, targetElement)) return 58;
  if (elementControls(targetElement, birthElement)) return 18;
  return 50;
}

function elementControls(from: FiveElement, to: FiveElement): boolean {
  const cycle: Record<FiveElement, FiveElement> = {
    wood: "earth",
    earth: "water",
    water: "fire",
    fire: "metal",
    metal: "wood"
  };
  return cycle[from] === to;
}

function branchAffinity(a: BranchInfo, b: BranchInfo): number {
  const distance = circularDistance(a.index, b.index, 12);
  return cycleAffinity(distance, 6);
}

function cycleAffinity(distance: number, maximumDistance: number): number {
  return clamp(
    Math.round(100 * (1 - distance / Math.max(maximumDistance, 1))),
    0,
    100
  );
}

function manufacturerPair(
  facts: CalendarFacts,
  overall: number
): [string, string] {
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

function slotTranslation(
  score: number,
  highText: string,
  lowText: string
): string {
  if (score >= 70) return `要はスロットでいうと、${highText}日です。`;
  if (score <= 30) return `要はスロットでいうと、${lowText}日です。`;
  return "要はスロットでいうと、単独の要素で決めず、複数の相性条件が重なるところを見る日です。";
}

function rankFor(score: number): string {
  if (score >= 90) return "超強運";
  if (score >= 75) return "強運";
  if (score >= 60) return "好調";
  if (score >= 40) return "平常";
  if (score >= 20) return "慎重";
  return "低調";
}

function datesInYear(year: number): string[] {
  const output: string[] = [];
  const current = new Date(Date.UTC(year, 0, 1));

  while (current.getUTCFullYear() === year) {
    output.push(formatIsoDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return output;
}

function formatIsoDate(date: Date): string {
  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function stableUnit(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function elementLabel(element: FiveElement): string {
  const labels: Record<FiveElement, string> = {
    wood: "木",
    fire: "火",
    earth: "土",
    metal: "金",
    water: "水"
  };
  return labels[element];
}

function polarityLabel(polarity: Polarity): string {
  return polarity === "yang" ? "陽" : "陰";
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
