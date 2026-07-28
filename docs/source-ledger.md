# ヒキヨミ 出典台帳

この台帳は、暦・天文・占術解釈・安全制約を混同しないための管理表です。

## 信頼区分

- **A**: 公的機関・公式データ・一次的な計算資料
- **B**: 原典・校訂版・学術研究
- **C**: 複数の専門資料で共通する解釈
- **P**: ヒキヨミ独自の変換規則。伝統的事実とは別物
- **未採用**: 候補だが、ルールへ接続していない

## 登録済み資料

| Source ID | 区分 | 資料 | 採用内容 | 状態 |
|---|---|---|---|---|
| NAOJ-KANSHI-001 | A | 国立天文台 暦Wiki／干支 | 十干と十二支を組み合わせた60周期 | 使用中 |
| NAOJ-JUNISHI-TIME-001 | A | 国立天文台 暦Wiki／十二支 | 定時法における十二支と2時間区分 | 使用中 |
| NAOJ-24SEKKI-001 | A | 国立天文台 こよみ用語解説／二十四節気 | 太陽黄経による二十四節気の定義 | 次工程 |
| JPL-HORIZONS-001 | A | NASA/JPL Horizons System | 太陽・月・惑星等の高精度暦データ | 未接続 |
| IANA-TZDB-001 | A | IANA Time Zone Database | 地域別UTCオフセット・夏時間の履歴 | 出生地対応時 |
| WHO-GAMBLING-001 | A | WHO Gambling fact sheet | 鑑定文・行動提案の安全制約 | 文面層で使用 |
| HIKIYOMI-METHOD-001 | P | ヒキヨミ独自合議方式 | 暦の事実を中間指標へ変換する独自ルール | 使用中 |

## URL

- NAOJ-KANSHI-001: https://eco.mtk.nao.ac.jp/koyomi/wiki/B4B3BBD9.html
- NAOJ-JUNISHI-TIME-001: https://eco.mtk.nao.ac.jp/koyomi/wiki/BDBDC6F3BBD9.html
- NAOJ-24SEKKI-001: https://eco.mtk.nao.ac.jp/koyomi/faq/24sekki.html
- JPL-HORIZONS-001: https://ssd.jpl.nasa.gov/horizons/
- IANA-TZDB-001: https://www.iana.org/time-zones
- WHO-GAMBLING-001: https://www.who.int/news-room/fact-sheets/detail/gambling
- HIKIYOMI-METHOD-001: `docs/methodology.md`

## 運用ルール

1. すべての点数増減は `ruleId` と `sourceIds` を持つ。
2. 公的な暦計算と、占い上の意味付けを別レイヤーにする。
3. 同一原典の転載数を根拠の数として数えない。
4. 流派差がある解釈は、単一の事実として扱わない。
5. 独自規則は必ず `P` と明記し、古典由来と偽らない。
6. 惑星位置や時差履歴はLLMに暗算させず、公式データまたは検証済みコードで計算する。
