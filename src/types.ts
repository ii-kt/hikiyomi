export interface Env {
  DB: D1Database;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  FORTUNE_SALT: string;
}

export interface UserRecord {
  user_id: string;
  adult_confirmed: number;
  birth_date: string | null;
  birth_time: string | null;
  birth_time_known: number;
  birth_timezone: string | null;
  birth_location_json: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FortuneItem {
  name: string;
  meaning: string;
}

export interface FortuneAnalysis {
  assessmentVersion: string;
  confidence: "low" | "medium" | "high";
  consensus: number;
  mainFactors: string[];
  conflicts: string[];
  sourceRuleIds: string[];
  sourceIds: string[];
}

export interface FortuneResult {
  engineVersion?: string;
  date: string;
  overall: number;
  rank: string;
  draw: number;
  /** Internal guidance scores kept for deterministic derivation and cache compatibility. */
  selection: number;
  flow: number;
  calmness: number;
  luckyDigit: number;
  luckyNumbers: [number, number];
  luckyColor: FortuneItem;
  luckyItem: FortuneItem;
  machineStyle: FortuneItem;
  compatibleManufacturers: [string, string];
  luckyTime: string;
  theme: string;
  caution: string;
  narrative: string;
  analysis?: FortuneAnalysis;
}

export interface LineWebhookBody {
  destination?: string;
  events?: LineWebhookEvent[];
}

export interface LineWebhookEvent {
  type: string;
  webhookEventId?: string;
  replyToken?: string;
  timestamp?: number;
  source?: {
    type?: string;
    userId?: string;
  };
  message?: {
    type?: string;
    id?: string;
    text?: string;
  };
  postback?: {
    data?: string;
    params?: {
      date?: string;
      datetime?: string;
      time?: string;
    };
  };
}

export type LineMessage = Record<string, unknown>;
