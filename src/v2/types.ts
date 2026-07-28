export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type Polarity = "yang" | "yin";

export type MetricKey =
  | "activity"
  | "judgment"
  | "continuity"
  | "adaptability"
  | "caution"
  | "impulseControl"
  | "concentration"
  | "switching";

export type ContributionKind =
  | "calendar"
  | "numerology"
  | "birth-time"
  | "deterministic-variation";

export interface StemInfo {
  index: number;
  kanji: string;
  reading: string;
  element: FiveElement;
  polarity: Polarity;
}

export interface BranchInfo {
  index: number;
  kanji: string;
  reading: string;
  element: FiveElement;
  polarity: Polarity;
  timeRange: string;
}

export interface SexagenaryDay {
  index: number;
  label: string;
  stem: StemInfo;
  branch: BranchInfo;
  julianDayNumber: number;
  sourceIds: string[];
}

export interface CalendarFacts {
  birthDate: string;
  targetDate: string;
  birthNumerology: number;
  targetNumerology: number;
  birthDay: SexagenaryDay;
  targetDay: SexagenaryDay;
  birthTimeKnown: boolean;
  birthHourBranch: BranchInfo | null;
  sourceIds: string[];
}

export interface FoundationInput {
  userId: string;
  birthDate: string;
  birthTime?: string | null;
  birthTimeKnown: boolean;
  targetDate: string;
  salt: string;
}

export interface RuleDefinition {
  ruleId: string;
  description: string;
  kind: ContributionKind;
  sourceIds: string[];
  status: "active" | "provisional" | "disabled";
}

export interface RuleContribution {
  ruleId: string;
  kind: ContributionKind;
  metric: MetricKey;
  delta: number;
  basis: string;
  sourceIds: string[];
}

export interface MetricResult {
  metric: MetricKey;
  base: number;
  score: number;
  contributions: RuleContribution[];
}

export interface FoundationAssessment {
  version: "v2-foundation-1";
  facts: CalendarFacts;
  metrics: Record<MetricKey, MetricResult>;
  contributions: RuleContribution[];
  sourceIds: string[];
}
