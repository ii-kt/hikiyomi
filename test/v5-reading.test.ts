import { describe, expect, it } from "vitest";
import { fortuneModeMessage } from "../src/fortune-mode-message";
import {
  fortuneMessages,
  reasonMessage
} from "../src/fortune-messages";
import type { FortuneResult, UserRecord } from "../src/types";

const baseUrl = "https://hikiyomi.example.workers.dev";
const user: UserRecord = {
  user_id: "U_TEST",
  adult_confirmed: 1,
  birth_date: "1996-04-18",
  birth_time: null,
  birth_time_known: 0,
  birth_timezone: null,
  birth_location_json: null,
  play_location: null,
  play_period: null,
  status: "active",
  created_at: "2026-08-02T00:00:00.000Z",
  updated_at: "2026-08-02T00:00:00.000Z"
};
const fortune: FortuneResult = {
  engineVersion: "v2-fortune-7",
  date: "2026-08-02",
  overall: 86,
  rank: "強運",
  draw: 91,
  selection: 72,
  flow: 80,
  calmness: 64,
  luckyDigit: 7,
  luckyNumbers: [18, 42],
  luckyColor: {
    name: "ネイビー",
    meaning: "水の象徴である流動と洞察を表す色"
  },
  machineStyle: {
    name: "スマスロAT機",
    meaning: "水の陽が示す大きな流動を、展開変化の大きいタイプへ対応させた候補"
  },
  compatibleManufacturers: ["ニューギン", "コナミアミューズメント"],
  luckyTime: "19:00〜20:00",
  narrative:
    "2026年の365日中、上位52位の86点です。今日は「スマスロAT機」と相性が出ています。",
  analysis: {
    assessmentVersion: "v2-foundation-1",
    confidence: "high",
    consensus: 0.74,
    mainFactors: ["六十干支の巡り", "五行・陰陽"],
    conflicts: [],
    sourceRuleIds: ["ANNUAL-PERCENTILE-SCALE-001"],
    sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"],
    scoreScale: {
      kind: "annual-percentile",
      year: 2026,
      raw: 71.25,
      percentile: 86,
      rankFromTop: 52,
      totalDays: 365
    },
    systems: [
      {
        id: "sexagenary",
        label: "六十干支の巡り",
        score: 82,
        basis: "出生日と対象日の60日周期上の距離は5です。",
        slotTranslation:
          "要はスロットでいうと、展開の波をつかみやすい日です。",
        sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"]
      },
      {
        id: "five-elements",
        label: "五行・陰陽",
        score: 91,
        basis: "出生日干と対象日干の五行が相生です。",
        slotTranslation:
          "要はスロットでいうと、おすすめタイプとの噛み合いが強い日です。",
        sourceIds: ["NAOJ-KANSHI-001", "HIKIYOMI-METHOD-001"]
      }
    ],
    slotSummary:
      "今日は追い風が強い日です。自分のヒキを信じて楽しめます。",
    birthTimeUsed: true
  }
};

function json(value: unknown): string {
  return JSON.stringify(value);
}

describe("V7 reading modes", () => {
  it("shows optional inputs before the reading choice", () => {
    const message = json(fortuneModeMessage(user));

    expect(message).toContain("任意項目を確認してください");
    expect(message).toContain("出生時刻");
    expect(message).toContain("出生地");
    expect(message).toContain("今日打つ地域");
    expect(message).toContain("遊技予定");
    expect(message).toContain("action=edit_birthtime");
    expect(message).toContain("action=edit_birthlocation");
    expect(message).toContain("action=edit_playlocation");
    expect(message).toContain("action=edit_playperiod");
    expect(message).toContain("サク読み");
    expect(message).toContain("ガチ読み");
  });

  it("shows registered optional values", () => {
    const message = json(fortuneModeMessage({
      ...user,
      birth_time: "07:31",
      birth_time_known: 1,
      birth_location_json: JSON.stringify({ label: "浜松市" }),
      play_location: "豊橋市",
      play_period: "夕方から"
    }));

    expect(message).toContain("07:31");
    expect(message).toContain("浜松市");
    expect(message).toContain("豊橋市");
    expect(message).toContain("夕方から");
  });

  it("returns one responsive result message for サク読み", () => {
    const messages = fortuneMessages(fortune, baseUrl, "quick");
    const serialized = json(messages);

    expect(messages).toHaveLength(1);
    expect(serialized).toContain("86");
    expect(serialized).toContain("上位52位");
    expect(serialized).toContain("スマスロAT機");
    expect(serialized).toContain('"size":"mega"');
    expect(serialized).not.toContain('"size":"giga"');
    expect(serialized).toContain("ニューギン\\nコナミアミューズメント");
    expect(serialized).toContain('"adjustMode":"shrink-to-fit"');
  });

  it("returns the same result plus detailed roots for ガチ読み", () => {
    const messages = fortuneMessages(fortune, baseUrl, "deep");
    const serialized = json(messages);

    expect(messages).toHaveLength(2);
    expect(serialized).toContain("【占術的な根拠】");
    expect(serialized).toContain("【今日のヒキヨミ】");
    expect(serialized).toContain("六十干支の巡り");
    expect(serialized).toContain("五行・陰陽");
    expect(serialized).toContain("スマスロAT機");
  });

  it("uses the same deep reading for the legacy reason action", () => {
    const serialized = json(reasonMessage(fortune, baseUrl));

    expect(serialized).toContain("【占術的な根拠】");
    expect(serialized).toContain("【今日のヒキヨミ】");
  });
});
