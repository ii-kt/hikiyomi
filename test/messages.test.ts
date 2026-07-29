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
  birth_time: "14:20",
  birth_time_known: 1,
  birth_timezone: null,
  birth_location_json: null,
  status: "active",
  created_at: "2026-07-29T00:00:00.000Z",
  updated_at: "2026-07-29T00:00:00.000Z"
};
const fortune: FortuneResult = {
  engineVersion: "v2-fortune-2",
  date: "2026-07-29",
  overall: 72,
  rank: "好調",
  draw: 76,
  selection: 71,
  flow: 68,
  calmness: 70,
  luckyDigit: 7,
  luckyNumbers: [18, 42],
  luckyColor: { name: "ネイビー", meaning: "落ち着いて観察する色" },
  luckyItem: { name: "腕時計", meaning: "時間を区切る道具" },
  machineStyle: { name: "打ち慣れた機種", meaning: "判断軸を保ちやすい" },
  compatibleManufacturers: ["サミー", "大都技研"],
  luckyTime: "14:00〜15:00",
  theme: "打ち慣れた基準を優先し、候補を絞る",
  caution: "勢いが出た後ほど、時計と予算を確認する",
  narrative: "今日は打ち慣れた基準を優先し、候補を絞って楽しむ日です。相性メーカーはサミーと大都技研ですが、設定状況を示すものではありません。",
  analysis: {
    assessmentVersion: "v2-foundation-1",
    confidence: "medium",
    consensus: 0.74,
    mainFactors: ["六十干支距離 12/60", "本命数と対象日数の距離 2/9"],
    conflicts: ["引き運では活動性と集中傾向の判定が分かれている"],
    sourceRuleIds: ["CAL-STEM-RELATION-001", "FINAL-SCORE-MAP-001"],
    sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"]
  }
};

function json(value: unknown): string {
  return JSON.stringify(value);
}

describe("LINE UI messages", () => {
  it("starts registration directly with birth date and legal links", () => {
    const serialized = json(birthDateMessage(baseUrl));
    expect(serialized).toContain("action=set_birthdate");
    expect(serialized).not.toContain("action=adult_yes");
    expect(serialized).toContain(`${baseUrl}/terms`);
    expect(serialized).toContain(`${baseUrl}/privacy`);
  });

  it("allows an exact or unknown birth time", () => {
    const serialized = json(birthTimeMessage(baseUrl));
    expect(serialized).toContain("action=set_birthtime");
    expect(serialized).toContain("action=birthtime_unknown");
  });

  it("shows current profile with change and deletion controls", () => {
    const serialized = json(settingsMessage(user, baseUrl));
    expect(serialized).toContain("1996年4月18日");
    expect(serialized).toContain("14:20");
    expect(serialized).toContain("action=edit_birthdate");
    expect(serialized).toContain("action=edit_birthtime");
    expect(serialized).toContain("action=delete_confirm");
  });

  it("requires a second tap before destructive deletion", () => {
    const serialized = json(deleteConfirmationMessage());
    expect(serialized).toContain("action=delete_account");
    expect(serialized).toContain("action=settings");
  });

  it("shows only meaningful public scores and adds practical guidance", () => {
    const serialized = json(fortuneMessage(fortune, baseUrl));
    expect(serialized).toContain("引き運");
    expect(serialized).not.toContain("台選び運");
    expect(serialized).not.toContain("流れ運");
    expect(serialized).not.toContain("冷静さ運");
    expect(serialized).toContain("相性のよい機種タイプ");
    expect(serialized).toContain("相性メーカー");
    expect(serialized).toContain("サミー／大都技研");
    expect(serialized).toContain("今日の立ち回りテーマ");
    expect(serialized).toContain("今日の注意ポイント");
    expect(serialized).toContain("提携・推奨関係はありません");
    expect(serialized).toContain("action=reason");
    expect(serialized).toContain("action=settings");
    expect(serialized).toContain(`${baseUrl}/terms`);
  });

  it("labels analysis values as internal fortune indicators", () => {
    const serialized = json(reasonMessage(fortune, baseUrl));
    expect(serialized).toContain("鑑定内の参考度");
    expect(serialized).toContain("鑑定内の一致度");
    expect(serialized).toContain("74%");
    expect(serialized).toContain("六十干支距離");
    expect(serialized).toContain("勝率や的中確率ではありません");
  });

  it("provides guided navigation for help and unknown text", () => {
    expect(json(helpMessage(baseUrl))).toContain("action=fortune");
    const unknown = json(unknownMessage());
    expect(unknown).toContain("action=fortune");
    expect(unknown).toContain("action=settings");
    expect(unknown).toContain("action=help");
  });
});
