# ヒキヨミ

LINE公式アカウント向けの、1日1回・ワンタップ完結型スロット占いBotです。

## 現在の実装

### 初回登録

- 必須入力は生年月日だけ
- 生年月日による18歳以上の自動判定
- 出生時刻は登録情報から任意追加
- 出生時刻が不明でも減点・利用制限なし

### 占いエンジン v4

- 日付の六十干支、十干、十二支、陰陽、五行
- 生年月日と対象日の縮約数
- 任意の出生時刻を十二支の時刻区分へ変換
- 総合スロ運と引き運
- 今日のおすすめスロットタイプ
  - Aタイプ
  - AT機
  - スマスロAT機
  - メダルAT機
- 相性メーカー2社
- ラッキー末尾、色、時刻
- 同一ユーザー・同一日の結果固定
- ルール、出典ID、内部寄与の追跡

「台選び運」「流れ運」「冷静さ運」「意識する数字」「ラッキーアイテム」「立ち回りテーマ」「注意ポイント」は表示・生成しません。

### 占いと予測の境界

ヒキヨミは、暦・数・象徴を解釈する娯楽占いです。

- 干支・五行・陰陽等の暦構造: 公的資料に基づく計算
- 点数、スロットタイプ、メーカー、ラッキー要素: ヒキヨミ独自の象徴変換

時間・予算・休憩等の一般的な安全助言は、占い結果の生成ロジックへ混ぜません。

詳細は `docs/methodology.md` を参照してください。

### 鑑定文

外部生成AIは使用しません。コードで確定した結果だけを短い定型文へ組み立てます。

### LINE利用導線

- 友だち追加直後に生年月日を登録
- すぐに「今日のスロ運」を利用可能
- 結果が1枚で完結するFlex Message
- 登録情報の確認・変更・削除
- 出生時刻の任意追加
- 使い方、利用規約、プライバシーポリシーへの導線
- 自由会話を行わず、操作をクイックリプライへ誘導
- 3分割リッチメニュー
  - 今日のスロ運
  - 登録情報
  - 使い方

## 技術構成

- Cloudflare Workers
- Cloudflare D1
- LINE Messaging API
- TypeScript
- Vitest
- sharp（リッチメニュー画像生成時のみ）

## 本番に含まれる範囲

Cloudflare Workersへデプロイされるエントリーポイントは `src/index.ts` です。

`test/`、`docs/`、`scripts/`、`.github/`、`config/` は開発資産であり、Workerの実行コードにはバンドルされません。

## 開発

```bash
npm install
npm run check
npm run dev
```

D1マイグレーション：

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

本番デプロイ：

```bash
npm run deploy
```

## リッチメニュー

定義の正本は `config/rich-menu.json` です。

```bash
npm run richmenu:build
LINE_CHANNEL_ACCESS_TOKEN=... npm run richmenu:setup
```

## 秘密情報

秘密情報はリポジトリへ保存せず、CloudflareまたはGitHub ActionsのSecretsへ登録します。

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `FORTUNE_SALT`

既存環境に残っている `GEMINI_API_KEY` は現在の鑑定処理では使用しません。

## 公開ページ

- `/`：サービス概要
- `/help`：使い方
- `/terms`：利用規約
- `/privacy`：プライバシーポリシー
- `/webhook`：LINE Webhook受信先

## 文書

- `docs/source-ledger.md`：出典台帳
- `docs/methodology.md`：暦計算と象徴変換の方式
