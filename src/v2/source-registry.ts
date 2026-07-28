export const SOURCE_REGISTRY = [
  {
    id: "NAOJ-KANSHI-001",
    title: "国立天文台 暦Wiki／干支",
    url: "https://eco.mtk.nao.ac.jp/koyomi/wiki/B4B3BBD9.html",
    tier: "A",
    role: "十干・十二支を組み合わせた60周期の暦構造"
  },
  {
    id: "NAOJ-JUNISHI-TIME-001",
    title: "国立天文台 暦Wiki／十二支",
    url: "https://eco.mtk.nao.ac.jp/koyomi/wiki/BDBDC6F3BBD9.html",
    tier: "A",
    role: "定時法における十二支と2時間区分の対応"
  },
  {
    id: "NAOJ-24SEKKI-001",
    title: "国立天文台 こよみ用語解説／二十四節気",
    url: "https://eco.mtk.nao.ac.jp/koyomi/faq/24sekki.html",
    tier: "A",
    role: "太陽黄経による二十四節気の定義"
  },
  {
    id: "JPL-HORIZONS-001",
    title: "NASA/JPL Horizons System",
    url: "https://ssd.jpl.nasa.gov/horizons/",
    tier: "A",
    role: "太陽・月・惑星等の高精度暦データ。後続工程で接続予定"
  },
  {
    id: "IANA-TZDB-001",
    title: "IANA Time Zone Database",
    url: "https://www.iana.org/time-zones",
    tier: "A",
    role: "地域別のUTCオフセット・夏時間の履歴。出生地対応時に使用予定"
  },
  {
    id: "WHO-GAMBLING-001",
    title: "WHO Gambling fact sheet",
    url: "https://www.who.int/news-room/fact-sheets/detail/gambling",
    tier: "A",
    role: "鑑定文と行動提案の安全制約"
  },
  {
    id: "HIKIYOMI-METHOD-001",
    title: "ヒキヨミ独自合議方式",
    url: "docs/methodology.md",
    tier: "P",
    role: "暦の事実をスロ運の中間指標へ変換する独自ルール。伝統占術の事実とは区別"
  }
] as const;

export type SourceId = (typeof SOURCE_REGISTRY)[number]["id"];

export function sourceExists(sourceId: string): boolean {
  return SOURCE_REGISTRY.some((source) => source.id === sourceId);
}
