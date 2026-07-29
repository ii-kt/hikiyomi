import { describe, expect, it } from "vitest";
import {
  helpHtml,
  homeHtml,
  privacyHtml,
  termsHtml
} from "../src/legal";

const baseUrl = "https://hikiyomi.example.workers.dev";

describe("public pages", () => {
  it("links the service home to help, terms, and privacy", () => {
    const html = homeHtml(baseUrl);
    expect(html).toContain(`${baseUrl}/help`);
    expect(html).toContain(`${baseUrl}/terms`);
    expect(html).toContain(`${baseUrl}/privacy`);
    expect(html).toContain("勝敗、収支を予測または保証するものではありません");
  });

  it("documents birth-date-only onboarding and practical result fields", () => {
    const html = helpHtml(baseUrl);
    expect(html).toContain("生年月日を登録");
    expect(html).toContain("出生時刻は不要");
    expect(html).toContain("おすすめスロットタイプ");
    expect(html).toContain("相性メーカー");
    expect(html).toContain("ラッキー末尾");
    expect(html).toContain("登録情報の変更・削除");
    expect(html).not.toContain("必要なら根拠を確認");
  });

  it("states that no result data is sent to an external generative AI", () => {
    const html = privacyHtml();
    expect(html).toContain("外部の生成AIへ送信しません");
    expect(html).not.toContain("Gemini APIへ送信する場合があります");
    expect(html).toContain("保存済み占い結果を削除");
  });

  it("separates cultural divination from scientific win prediction", () => {
    const html = termsHtml();
    expect(html).toContain("占いは、未知の事柄について");
    expect(html).toContain("ヒキヨミ独自の象徴変換");
    expect(html).toContain("点数は勝率や的中確率ではありません");
    expect(html).toContain("提携、協賛、推奨、公式認定を示すものではありません");
    expect(html).toContain("追加投資、損失回収の根拠にしないでください");
  });
});
