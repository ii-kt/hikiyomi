import { describe, expect, it } from "vitest";
import {
  fortuneMessage,
  reasonMessage
} from "../src/fortune-messages";
import {
  birthDateMessage,
  birthTimeMessage,
  deleteConfirmationMessage,
  helpMessage,
  settingsMessage,
  unknownMessage
} from "../src/messages";
import type { FortuneResult, UserRecord } from "../src/types";

const baseUrl = "https://hikiyomi.example.workers.dev";
const user: UserRecord = {
  user_id: "U_TEST",
  adult_confirmed: 1,
  birth_date: "1996-04-18",
  birth_time: null,
  birth_time_known: -1,
  birth_timezone: null,
  birth_location_json: null,
  status: "active",
  created_at: "2026-07-29T00:00:00.000Z",
  updated_at: "2026-07-29T00:00:00.000Z"
};
const fortune: FortuneResult = {
  engineVersion: "v2-fortune-9",
  date: "2026-07-29",
  overall: 72,
  rank: "好調",
  draw: 76,
  selection: 71,
  flow: 68,
  calmness: 70,
  luckyDigit: 7,
  luckyNumbers: [18, 42],
  luckyColor: { name: "ネイビー", meaning: "水の象徴である流動と洞察を表す色" },
  luckyItem: { name: "ネイビーのタオル", meaning: "水の陽が示す流れと切り替えを意識するお守り" },
  luckyDrink: { name: "ミネラルウォーター", meaning: "水の陽が示す流動と切り替えに合わせた一杯" },
  luckyBoost: {
    maxPoints: 16,
    appliedPoints: 16,
    boostedOverall: 88,
    components: {
      luckyDigit: 3,
      luckyColor: 4,
      luckyItem: 3,
      luckyDrink: 3,
      luckyTime: 3
    }
  },
  machineStyle: {
    name: "スマスロAT機",
    meaning: "水の陽が示す大きな流動を、展開変化の大きいタイプへ対応させた候補"
  },
  compatibleManufacturers: ["サミー", "大都技研"],
  luckyTime: "14:00〜15:00",
  narrative: "今日は「スマスロAT機」と相性が出ています。相性メーカーはサミー／大都技研。ラッキー末尾は7、ラッキーカラーはネイビーです。",
  analysis: {
    assessmentVersion: "v2-foundation-1",
    confidence: "medium",
    consensus: 0.74,
    mainFactors: ["対象日の干支", "六十干支距離"],
    conflicts: [],
    sourceRuleIds: ["FINAL-SCORE-MAP-004", "LUCKY-BOOST-001"],
    sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"],
    slotSummary: "今日は必要以上に弱気にならず、自分のヒキを信じて楽しむ日です。"
  }
};

function json(value: unknown): string {
  return JSON.stringify(value);
}

describe("LINE UI messages", () => {
  it("starts registration with birth date and no required birth-time step", () => {
    const serialized = json(birthDateMessage(baseUrl));
    expect(serialized).toContain("action=set_birthdate");
    expect(serialized).toContain("出生時刻は不要");
    expect(serialized).toContain(`${baseUrl}/terms`);

    const completion = json(birthTimeMessage(baseUrl));
    expect(completion).toContain("準備ができました");
    expect(completion).not.toContain("action=set_birthtime");
  });

  it("keeps birth time available only as an optional settings action", () => {
    const optionalTime = json(birthTimeMessage(baseUrl, true));
    expect(optionalTime).toContain("action=set_birthtime");
    expect(optionalTime).toContain("action=birthtime_unknown");

    const serialized = json(settingsMessage(user, baseUrl));
    expect(serialized).toContain("1996年4月18日");
    expect(serialized).toContain("未登録（任意）");
    expect(serialized).toContain("出生時刻を任意で追加");
    expect(serialized).toContain("action=delete_confirm");
  });

  it("requires a second tap before destructive deletion", () => {
    const serialized = json(deleteConfirmationMessage());
    expect(serialized).toContain("action=delete_account");
    expect(serialized).toContain("action=settings");
  });

  it("shows the full lucky set and a separate premium-looking boost score", () => {
    const serialized = json(fortuneMessage(fortune, baseUrl));
    expect(serialized).toContain("引き運");
    expect(serialized).toContain("今日のおすすめスロットタイプ");
    expect(serialized).toContain("スマスロAT機");
    expect(serialized).toContain("相性メーカー");
    expect(serialized).toContain("ラッキー末尾");
    expect(serialized).toContain("ラッキーカラー");
    expect(serialized).toContain("ラッキーアイテム");
    expect(serialized).toContain("相性ドリンク");
    expect(serialized).toContain("ラッキータイム");
    expect(serialized).toContain("ラッキー要素をすべて取り入れた場合");
    expect(serialized).toContain("開運スコア");
    expect(serialized).toContain("88 / 100");
    expect(serialized).toContain("+16");
    expect(serialized).toContain("基礎スロ運 72/100");
    expect(serialized).not.toContain("今日の立ち回りテーマ");
    expect(serialized).not.toContain("今日の注意ポイント");
    expect(serialized).not.toMatch(/上限|取り返|休憩|終了時刻|小さなメモ/);
    expect(serialized).not.toContain("意識する数字");
    expect(serialized).not.toContain("action=reason");
    expect(serialized).toContain("action=settings");
    expect(serialized).not.toContain("利用規約");
    expect(serialized).not.toContain("プライバシー");
  });

  it("shows detailed roots and the same boost score outside the main result card", () => {
    const serialized = json(reasonMessage(fortune, baseUrl));
    expect(serialized).toContain("【占術的な根拠】");
    expect(serialized).toContain("【今日のヒキヨミ】");
    expect(serialized).toContain("【開運スコア】");
    expect(serialized).toContain("88/100（+16）");
    expect(serialized).toContain("基礎スロ運は72/100のまま");
    expect(serialized).not.toContain("74%");
  });

  it("provides guided navigation for help and unknown text", () => {
    const help = json(helpMessage(baseUrl));
    expect(help).toContain("生年月日だけ登録");
    expect(help).not.toContain("鑑定の根拠");
    expect(help).toContain("action=fortune");

    const unknown = json(unknownMessage());
    expect(unknown).toContain("action=fortune");
    expect(unknown).toContain("action=settings");
    expect(unknown).toContain("action=help");
  });
});
