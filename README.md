# ヒキヨミ

LINE公式アカウント向けの、1日1回・ワンタップ完結型スロット占いBotです。

## 現在の実装

- 生年月日による18歳以上の自動判定
- 任意の出生時刻登録（不明でも利用可能・減点なし）
- 日付の六十干支、十干、十二支、陰陽、五行
- 生年月日と対象日の縮約数
- 8種類の中間指標
- 引き運、台選び運、流れ運、冷静さ運のV2点数
- ラッキー末尾、数字、色、アイテム、機種タイプ、時刻、テーマ
- 同一ユーザー・同一日の結果固定
- ルール、増減理由、出典IDの追跡
- 合議度、確信度、主要因、矛盾の保存
- Gemini 3.5 Flash-Liteによる鑑定文整形
- Gemini停止時・危険出力時の決定論的フォールバック
- LINEユーザーID、生年月日、出生時刻をGeminiへ送らない匿名化

## 技術構成

- Cloudflare Workers
- Cloudflare D1
- LINE Messaging API
- Gemini API
- TypeScript
- Vitest

## 開発

```bash
npm install
npm run typecheck
npm test
npm run dev
```

D1マイグレーション：

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

秘密情報はリポジトリへ保存せず、CloudflareのSecretsへ登録します。

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `GEMINI_API_KEY`
- `FORTUNE_SALT`

## 文書

- `docs/source-ledger.md`：出典台帳
- `docs/methodology.md`：点数統合、根拠追跡、Gemini利用方式

## 注意

ヒキヨミは占い・娯楽サービスです。実際の設定、出玉、勝敗、収支を予測または保証するものではありません。
