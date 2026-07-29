# ヒキヨミ

LINE公式アカウント向けの、1日1回・ワンタップ完結型スロット占いBotです。

## 現在の実装

### 占いエンジン

- 生年月日による18歳以上の自動判定
- 任意の出生時刻登録（不明でも利用可能・減点なし）
- 日付の六十干支、十干、十二支、陰陽、五行
- 生年月日と対象日の縮約数
- 8種類の中間指標
- 総合スロ運と引き運のV2点数
- 相性のよい機種タイプ
- 相性メーカー2社
- 今日の立ち回りテーマと注意ポイント
- ラッキー末尾、数字、色、アイテム、時刻
- 同一ユーザー・同一日の結果固定
- ルール、増減理由、出典IDの追跡
- 鑑定内の参考度・一致度、主要因、判断の分岐を保存
- Geminiによる鑑定文整形
- Gemini停止・タイムアウト・危険出力時の決定論的フォールバック
- LINEユーザーID、生年月日、出生時刻、非表示の内部指標をGeminiへ送らない匿名化

「台選び運」「流れ運」「冷静さ運」は、意味が曖昧で本人の能力評価と誤認されるため、利用者向けの点数表示から除外しています。内部の中間指標は、総合点、相性傾向、テーマ、注意ポイントを決めるためだけに使用します。

相性メーカーは占い上の候補です。実際の設定状況、勝率、推奨機種を示すものではなく、メーカー各社との提携・協賛関係もありません。

### LINE利用導線

- 友だち追加直後に生年月日を登録
- 出生時刻を選択、または「分からない」を選択
- 結果が1枚で完結するFlex Message
- 鑑定根拠、鑑定内の参考度・一致度、判断の分岐を追加表示
- 登録情報の確認・変更
- 登録情報と保存済み占い結果の削除
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
- Gemini API
- TypeScript
- Vitest
- sharp（リッチメニュー画像生成時のみ）

## 本番に含まれる範囲

Cloudflare Workersへデプロイされるエントリーポイントは `src/index.ts` です。

`test/`、`docs/`、`scripts/`、`.github/`、`config/` は、品質確認・説明・リッチメニュー設定に使用する開発資産であり、Workerの実行コードにはバンドルされません。

## 開発

```bash
npm install
npm run check
npm run dev
```

`npm run check` は、型検査・全テスト・リッチメニュー画像の生成検証をまとめて実行します。

D1マイグレーション：

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

## リッチメニュー

定義の正本は `config/rich-menu.json` です。

画像とLINE APIリクエストをローカル生成するだけの場合：

```bash
npm run richmenu:build
```

LINEへ作成・画像アップロード・デフォルト設定まで行う場合：

```bash
LINE_CHANNEL_ACCESS_TOKEN=... npm run richmenu:setup
```

処理内容：

1. 2500×843のPNGを生成
2. 1MB以下であることを検証
3. LINEのリッチメニュー定義検証APIを実行
4. 新しいリッチメニューを作成
5. 画像をアップロード
6. デフォルトリッチメニューに設定
7. このスクリプトが作成した旧メニューだけを削除

GitHub Actionsの `Setup LINE rich menu` から手動実行する場合は、Repository Secret `LINE_CHANNEL_ACCESS_TOKEN` が必要です。

## 秘密情報

秘密情報はリポジトリへ保存せず、CloudflareまたはGitHub ActionsのSecretsへ登録します。

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `GEMINI_API_KEY`
- `FORTUNE_SALT`

## 公開ページ

- `/`：サービス概要
- `/help`：使い方
- `/terms`：利用規約
- `/privacy`：プライバシーポリシー
- `/webhook`：LINE Webhook受信先

## 文書

- `docs/source-ledger.md`：出典台帳
- `docs/methodology.md`：点数統合、根拠追跡、Gemini利用方式

## 注意

ヒキヨミは占い・娯楽サービスです。実際の設定、出玉、勝敗、収支を予測または保証するものではありません。
