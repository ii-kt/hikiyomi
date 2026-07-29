# ヒキヨミ 出典台帳

この台帳は、暦・占いの文化的定義・科学的検証・安全制約・ヒキヨミ独自変換を混同しないための管理表です。

## 信頼区分

- **A**: 公的機関・公式データ・一次的な計算資料
- **B**: 原典・校訂版・査読研究・学術出版
- **C**: 複数の専門資料で共通する解釈
- **P**: ヒキヨミ独自の変換規則。伝統的事実とは別物
- **未採用**: 候補だが、ルールへ接続していない

## 登録済み資料

| Source ID | 区分 | 資料 | 採用内容 | 状態 |
|---|---|---|---|---|
| NAOJ-KANSHI-001 | A | 国立天文台 暦Wiki／干支 | 十干と十二支を組み合わせた60周期 | 使用中 |
| NAOJ-JUNISHI-TIME-001 | A | 国立天文台 暦Wiki／十二支 | 定時法における十二支と2時間区分 | 任意入力で使用 |
| NAOJ-24SEKKI-001 | A | 国立天文台 こよみ用語解説／二十四節気 | 太陽黄経による二十四節気の定義 | 次工程 |
| JPL-HORIZONS-001 | A | NASA/JPL Horizons System | 太陽・月・惑星等の高精度暦データ | 未接続 |
| IANA-TZDB-001 | A | IANA Time Zone Database | 地域別UTCオフセット・夏時間の履歴 | 出生地対応時 |
| WHO-GAMBLING-001 | A | WHO Gambling fact sheet | 時間・金額の事前制限、休憩等の安全指針 | 文面層で使用 |
| CAMBRIDGE-DIVINATION-001 | B | Cambridge University Press, Divination: A Cognitive Perspective | 占いを未知について知識を求める広範な文化的実践として整理 | サービス定義に使用 |
| NATURE-ASTROLOGY-TEST-001 | B | Carlson, Nature 318 (1985) | 出生図による性格記述を二重盲検で検証 | 科学的非保証の境界に使用 |
| HIKIYOMI-METHOD-001 | P | ヒキヨミ方式 v3 | 暦・数をスロット向け表示へ変換する独自ルール | 使用中 |

## URL

- NAOJ-KANSHI-001: https://eco.mtk.nao.ac.jp/koyomi/wiki/B4B3BBD9.html
- NAOJ-JUNISHI-TIME-001: https://eco.mtk.nao.ac.jp/koyomi/wiki/BDBDC6F3BBD9.html
- NAOJ-24SEKKI-001: https://eco.mtk.nao.ac.jp/koyomi/faq/24sekki.html
- JPL-HORIZONS-001: https://ssd.jpl.nasa.gov/horizons/
- IANA-TZDB-001: https://www.iana.org/time-zones
- WHO-GAMBLING-001: https://www.who.int/news-room/fact-sheets/detail/gambling
- CAMBRIDGE-DIVINATION-001: https://doi.org/10.1017/9781009541961
- NATURE-ASTROLOGY-TEST-001: https://doi.org/10.1038/318419a0
- HIKIYOMI-METHOD-001: `docs/methodology.md`

## 運用ルール

1. すべての点数増減は `ruleId` と `sourceIds` を持つ。
2. 公的な暦計算と、占い上の意味付けを別レイヤーにする。
3. 同一原典の転載数を根拠の数として数えない。
4. 流派差がある解釈は、単一の事実として扱わない。
5. 独自規則は必ず `P` と明記し、古典由来と偽らない。
6. 科学的に検証されていない予測を、確率・勝率・設定期待として表示しない。
7. 外部生成AIに鑑定理由を創作させない。
8. 惑星位置や時差履歴はLLMに暗算させず、公式データまたは検証済みコードで計算する。
