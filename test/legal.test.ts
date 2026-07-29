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

  it("documents the complete LINE flow and practical result fields", () => {
    const html = helpHtml(baseUrl);
    expect(html).toContain("生年月日を登録");
    expect(html).toContain("出生時刻を登録");
    expect(html).toContain("今日のスロ運");
    expect(html).toContain("相性のよい機種タイプとメーカー");
    expect(html).toContain("立ち回りテーマ、注意ポイント");
    expect(html).toContain("登録情報の変更・削除");
  });

  it("states exactly what Gemini receives and excludes private inputs", () => {
    const html = privacyHtml();
    expect(html).toContain("Gemini API");
    expect(html).toContain("LINEユーザー識別子、生年月日、出生時刻、サービス秘密値");
    expect(html).toContain("非表示の内部指標は送信しません");
    expect(html).toContain("保存済み占い結果を削除");
  });

  it("does not present internal indicators or manufacturer labels as predictions", () => {
    const html = termsHtml();
    expect(html).toContain("勝率や的中確率ではありません");
    expect(html).toContain("提携、協賛、推奨、公式認定を示すものではありません");
    expect(html).toContain("追加投資、損失回収の根拠にしないでください");
  });
});
