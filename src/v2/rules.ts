import { hashToUint32 } from "../crypto";
import {
  buildCalendarFacts,
  elementGenerates,
  polarityMatches
} from "./calendar";
import { sourceExists } from "./source-registry";
import type {
  CalendarFacts,
  FoundationAssessment,
  FoundationInput,
  MetricKey,
  MetricResult,
  RuleContribution,
  RuleDefinition
} from "./types";

export const FOUNDATION_RULES: readonly RuleDefinition[] = [
  {
    ruleId: "CAL-STEM-RELATION-001",
    description:
      "出生日干と対象日干の五行関係を集中・適応の中間指標へ変換する独自規則",
    kind: "calendar",
    sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"],
    status: "active"
  },
  {
    ruleId: "CAL-BRANCH-ALIGN-001",
    description:
      "出生日支と対象日支の一致・距離を継続と切替の中間指標へ変換する独自規則",
    kind: "calendar",
    sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"],
    status: "active"
  },
  {
    ruleId: "NUM-DAY-DISTANCE-001",
    description:
      "生年月日と対象日の縮約数の距離を判断・慎重性へ変換する独自規則",
    kind: "numerology",
    sourceIds: ["HIKIYOMI-METHOD-001"],
    status: "active"
  },
  {
    ruleId: "BIRTH-TIME-POLARITY-001",
    description:
      "出生時支が分かる場合だけ対象日支との陰陽関係を補助情報として使う",
    kind: "birth-time",
    sourceIds: ["NAOJ-JUNISHI-TIME-001", "HIKIYOMI-METHOD-001"],
    status: "active"
  },
  {
    ruleId: "VARIATION-001",
    description:
      "同一入力を固定しつつ日ごとの差を作る小幅な決定論的補正",
    kind: "deterministic-variation",
    sourceIds: ["HIKIYOMI-METHOD-001"],
    status: "active"
  }
] as const;

const METRICS: readonly MetricKey[] = [
  "activity",
  "judgment",
  "continuity",
  "adaptability",
  "caution",
  "impulseControl",
  "concentration",
  "switching"
];

export async function buildFoundationAssessment(
  input: FoundationInput
): Promise<FoundationAssessment> {
  validateRuleSources();

  const facts = buildCalendarFacts(input);
  const contributions = [
    ...evaluateCalendarRules(facts),
    ...(await createVariationContributions(input))
  ];

  const metrics = Object.fromEntries(
    METRICS.map((metric) => [metric, metricResult(metric, contributions)])
  ) as Record<MetricKey, MetricResult>;

  return {
    version: "v2-foundation-1",
    facts,
    metrics,
    contributions,
    sourceIds: [
      ...new Set([
        ...facts.sourceIds,
        ...contributions.flatMap((item) => item.sourceIds)
      ])
    ]
  };
}

export function validateRuleSources(): void {
  for (const rule of FOUNDATION_RULES) {
    if (rule.sourceIds.length === 0) {
      throw new Error(`${rule.ruleId} has no source IDs`);
    }

    for (const sourceId of rule.sourceIds) {
      if (!sourceExists(sourceId)) {
        throw new Error(`${rule.ruleId} references unknown source ${sourceId}`);
      }
    }
  }
}

function evaluateCalendarRules(facts: CalendarFacts): RuleContribution[] {
  const output: RuleContribution[] = [];
  const birthStem = facts.birthDay.stem;
  const targetStem = facts.targetDay.stem;

  if (birthStem.element === targetStem.element) {
    output.push(
      contribution(
        "CAL-STEM-RELATION-001",
        "calendar",
        "concentration",
        4,
        `日干の五行が同じ（${birthStem.kanji}/${targetStem.kanji}）`
      )
    );
    output.push(
      contribution(
        "CAL-STEM-RELATION-001",
        "calendar",
        "judgment",
        2,
        "同一要素として判断軸を固定"
      )
    );
  } else if (elementGenerates(birthStem.element, targetStem.element)) {
    output.push(
      contribution(
        "CAL-STEM-RELATION-001",
        "calendar",
        "activity",
        3,
        `${birthStem.element}から${targetStem.element}への生成関係`
      )
    );
  } else if (elementGenerates(targetStem.element, birthStem.element)) {
    output.push(
      contribution(
        "CAL-STEM-RELATION-001",
        "calendar",
        "adaptability",
        3,
        `${targetStem.element}から${birthStem.element}への生成関係`
      )
    );
  } else {
    output.push(
      contribution(
        "CAL-STEM-RELATION-001",
        "calendar",
        "caution",
        2,
        "日干の五行が非隣接のため確認を増やす独自補正"
      )
    );
  }

  const branchDistance = circularDistance(
    facts.birthDay.branch.index,
    facts.targetDay.branch.index,
    12
  );

  if (branchDistance === 0) {
    output.push(
      contribution(
        "CAL-BRANCH-ALIGN-001",
        "calendar",
        "continuity",
        4,
        `日支が一致（${facts.targetDay.branch.kanji}）`
      )
    );
  } else if (branchDistance <= 2) {
    output.push(
      contribution(
        "CAL-BRANCH-ALIGN-001",
        "calendar",
        "switching",
        2,
        `日支距離が${branchDistance}`
      )
    );
  } else if (branchDistance >= 5) {
    output.push(
      contribution(
        "CAL-BRANCH-ALIGN-001",
        "calendar",
        "adaptability",
        3,
        `日支距離が${branchDistance}で変化幅が大きい`
      )
    );
  }

  const numerologyDistance = circularDistance(
    facts.birthNumerology - 1,
    facts.targetNumerology - 1,
    9
  );

  if (numerologyDistance <= 1) {
    output.push(
      contribution(
        "NUM-DAY-DISTANCE-001",
        "numerology",
        "judgment",
        3,
        `縮約数の距離が${numerologyDistance}`
      )
    );
  } else if (numerologyDistance >= 4) {
    output.push(
      contribution(
        "NUM-DAY-DISTANCE-001",
        "numerology",
        "caution",
        3,
        `縮約数の距離が${numerologyDistance}`
      )
    );
    output.push(
      contribution(
        "NUM-DAY-DISTANCE-001",
        "numerology",
        "impulseControl",
        2,
        "判断前の一呼吸を重視する独自補正"
      )
    );
  } else {
    output.push(
      contribution(
        "NUM-DAY-DISTANCE-001",
        "numerology",
        "activity",
        1,
        `縮約数の距離が${numerologyDistance}`
      )
    );
  }

  if (facts.birthHourBranch) {
    if (
      polarityMatches(
        facts.birthHourBranch.polarity,
        facts.targetDay.branch.polarity
      )
    ) {
      output.push(
        contribution(
          "BIRTH-TIME-POLARITY-001",
          "birth-time",
          "concentration",
          2,
          `出生時支${facts.birthHourBranch.kanji}と対象日支の陰陽が一致`
        )
      );
    } else {
      output.push(
        contribution(
          "BIRTH-TIME-POLARITY-001",
          "birth-time",
          "switching",
          2,
          `出生時支${facts.birthHourBranch.kanji}と対象日支の陰陽が異なる`
        )
      );
    }
  }

  return output;
}

async function createVariationContributions(
  input: FoundationInput
): Promise<RuleContribution[]> {
  const value = await hashToUint32(
    `${input.userId}|${input.birthDate}|${input.birthTime ?? "unknown"}|${input.targetDate}|${input.salt}|v2`
  );
  const metric = METRICS[value % METRICS.length];
  if (!metric) throw new Error("variation metric is unavailable");

  const delta = ((value >>> 8) % 5) - 2;
  if (delta === 0) return [];

  return [
    contribution(
      "VARIATION-001",
      "deterministic-variation",
      metric,
      delta,
      "ユーザー・日付・秘密値から作る±2点以内の固定補正"
    )
  ];
}

function contribution(
  ruleId: string,
  kind: RuleContribution["kind"],
  metric: MetricKey,
  delta: number,
  basis: string
): RuleContribution {
  const rule = FOUNDATION_RULES.find((item) => item.ruleId === ruleId);
  if (!rule) throw new Error(`unknown rule ${ruleId}`);

  return {
    ruleId,
    kind,
    metric,
    delta,
    basis,
    sourceIds: [...rule.sourceIds]
  };
}

function metricResult(
  metric: MetricKey,
  contributions: RuleContribution[]
): MetricResult {
  const relevant = contributions.filter((item) => item.metric === metric);
  const score = clamp(
    50 + relevant.reduce((sum, item) => sum + item.delta, 0),
    20,
    95
  );

  return {
    metric,
    base: 50,
    score,
    contributions: relevant
  };
}

function circularDistance(a: number, b: number, size: number): number {
  const raw = Math.abs(a - b) % size;
  return Math.min(raw, size - raw);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
