# ヒキヨミ 出典台帳

この台帳は、暦・占いの文化的定義・科学的検証・ヒキヨミ独自変換を混同しないための管理表です。

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
| NAOJ-24SEKKI-001 | A | 国立天文台 こよみ用語解説／二十四節気 | 太陽黄経による二十四節気の定義 | 未接続 |
| JPL-HORIZONS-001 | A | NASA/JPL Horizons System | 太陽・月・惑星等の高精度暦データ | 未接続 |
| IANA-TZDB-001 | A | IANA Time Zone Database | 地域別UTCオフセット・夏時間の履歴 | 出生地対応時 |
| WHO-GAMBLING-001 | A | WHO Gambling fact sheet | 利用規約等の一般的な安全情報 | V5占い結果では不使用 |
| CAMBRIDGE-DIVINATION-001 | B | Cambridge University Press, Divination: A Cognitive Perspective | 占いを未知について知識を求める広範な文化的実践として整理 | サービス定義に使用 |
| NATURE-ASTROLOGY-TEST-001 | B | Carlson, Nature 318 (1985) | 出生図による性格記述を二重盲検で検証 | 科学的非保証の境界に使用 |
| HIKIYOMI-METHOD-001 | P | ヒキヨミ方式 v5 | 暦・数を年間順位の0〜100点、サク読み、ガチ読みに変換する独自ルール | 使用中 |

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

## V5の規則ID

- `ANNUAL-PERCENTILE-SCALE-001`: 対象年の全日を同条件で計算し、年間順位を0〜100点へ換算
- `FINAL-SCORE-MAP-003`: 五行・十二支・六十干支・数理・任意の時支を内部値へ統合
- `SLOT-TYPE-SYMBOLIC-001`: 対象日の五行・陰陽からスロットタイプへ変換
- `LUCKY-DERIVATION-001`: ラッキー末尾・色・時刻の決定論的導出
- `MANUFACTURER-DERIVATION-001`: メーカー候補2社の決定論的導出

## 運用ルール

1. すべての点数増減は `ruleId` と `sourceIds` を持つ。
2. 公的な暦計算と、占い上の意味付けを別レイヤーにする。
3. 同一原典の転載数を根拠の数として数えない。
4. 流派差がある解釈は、単一の事実として扱わない。
5. 独自規則は必ず `P` と明記し、古典由来と偽らない。
6. 外部生成AIに鑑定理由を創作させない。
7. V5占い結果へ一般的な安全助言を混ぜない。
8. 惑星位置や時差履歴はLLMに暗算させず、公式データまたは検証済みコードで計算する。
9. 未実装の四柱推命・九星気学・宿曜・月相・二十四節気を結果根拠として表示しない。
10. サク読みとガチ読みは同一の保存済み点数を使い、説明量だけを変える。
