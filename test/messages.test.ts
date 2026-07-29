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
  engineVersion: "v2-fortune-3",
  date: "2026-07-29",
  overall: 72,
  rank: "好調",
  draw: 76,
  selection: 71,
  flow: 68,
  calmness: 70,
  luckyDigit: 7,
  luckyNumbers: [18, 42],
  luckyColor: { name: "ネイビー", meaning: "水の象徴を意識する色" },
  luckyItem: { name: "腕時計", meaning: "終了時刻を確認する道具" },
  machineStyle: {
    name: "スマスロAT機",
    meaning: "五行と陰陽を現代の遊技分類へ置き換えた占い上の候補"
  },
  compatibleManufacturers: ["サミー", "大都技研"],
  luckyTime: "14:00〜15:00",
  theme: "始める前に終了時刻を決める",
  caution: "予定時刻を過ぎたら、結果に関係なく一度席を離れる",
  narrative: "今日は「スマスロAT機」が占い上の相性候補です。相性メーカーはサミー／大都技研、ラッキー末尾は7。始める前に終了時刻を決める。予定時刻を過ぎたら、結果に関係なく一度席を離れる。",
  analysis: {
    assessmentVersion: "v2-foundation-1",
    confidence: "medium",
    consensus: 0.74,
    mainFactors: ["対象日の干支", "六十干支距離"],
    conflicts: [],
    sourceRuleIds: ["FINAL-SCORE-MAP-002", "SAFE-GUIDANCE-001"],
    sourceIds: ["NAOJ-KANSHI-001", "WHO-GAMBLING-001"]
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

  it("shows only useful result fields and removes confusing details", () => {
    const serialized = json(fortuneMessage(fortune, baseUrl));
    expect(serialized).toContain("引き運");
    expect(serialized).toContain("今日のおすすめスロットタイプ");
    expect(serialized).toContain("スマスロAT機");
    expect(serialized).toContain("相性メーカー");
    expect(serialized).toContain("ラッキー末尾");
    expect(serialized).not.toContain("意識する数字");
    expect(serialized).not.toContain("鑑定内の参考度");
    expect(serialized).not.toContain("鑑定内の一致度");
    expect(serialized).not.toContain("今日の主な根拠");
    expect(serialized).not.toContain("action=reason");
    expect(serialized).toContain("action=settings");
  });

  it("explains the hidden methodology without technical score details", () => {
    const serialized = json(reasonMessage(fortune, baseUrl));
    expect(serialized).toContain("ヒキヨミ独自の象徴変換");
    expect(serialized).toContain("勝率や設定を予測する根拠ではありません");
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
