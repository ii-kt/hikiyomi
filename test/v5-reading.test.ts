import { describe, expect, it } from "vitest";
import { fortuneModeMessage } from "../src/fortune-mode-message";
import {
  fortuneMessages,
  reasonMessage
} from "../src/fortune-messages";
import type { FortuneResult } from "../src/types";

const baseUrl = "https://hikiyomi.example.workers.dev";
const fortune: FortuneResult = {
  engineVersion: "v2-fortune-5",
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
      "今年のあなたの中で上位15%です。要するにスロットでいうと、相性が出た条件を優先しやすい日です。",
    birthTimeUsed: true
  }
};

function json(value: unknown): string {
  return JSON.stringify(value);
}

describe("V5 reading modes", () => {
  it("offers concise and detailed display choices", () => {
    const message = json(fortuneModeMessage(false));

    expect(message).toContain("表示する内容を選んでください");
    expect(message).toContain("サク読み");
    expect(message).toContain("点数と今日のおすすめを簡潔に表示");
    expect(message).toContain("action=fortune_quick");
    expect(message).toContain("ガチ読み");
    expect(message).toContain("点数の理由と、スロット向けの解釈まで詳しく表示");
    expect(message).toContain("action=fortune_deep");
    expect(message).toContain("出生時刻を追加する");
    expect(message).not.toContain("まで読む");
  });

  it("does not repeat the optional birth-time prompt when registered", () => {
    const message = json(fortuneModeMessage(true));

    expect(message).not.toContain("出生時刻を追加する");
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
    expect(serialized).toContain("【要はスロットでいうと】");
    expect(serialized).toContain("六十干支の巡り");
    expect(serialized).toContain("五行・陰陽");
    expect(serialized).toContain("スマスロAT機");
  });

  it("uses the same deep reading for the legacy reason action", () => {
    const serialized = json(reasonMessage(fortune, baseUrl));

    expect(serialized).toContain("【占術的な根拠】");
    expect(serialized).toContain("要はスロットでいうと");
  });
});
