import type {
  FortuneAnalysis,
  FortuneResult,
  LineMessage
} from "./types";

const BRAND = "#11153D";
const BRAND_SOFT = "#20275A";
const GOLD = "#D6A92F";
const GOLD_SOFT = "#F4F1E8";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

export function fortuneMessage(
  result: FortuneResult,
  baseUrl: string
): LineMessage {
  const analysis = result.analysis;
  return withNavigation({
    type: "flex",
    altText: `${result.date}のスロ運は${result.overall}点・${result.rank}です`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: BRAND,
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: `${formatDate(result.date)}のスロ運`,
            color: "#E5E7EB",
            size: "sm"
          },
          {
            type: "box",
            layout: "baseline",
            margin: "md",
            contents: [
              {
                type: "text",
                text: String(result.overall),
                color: "#FFFFFF",
                weight: "bold",
                size: "5xl",
                flex: 0
              },
              {
                type: "text",
                text: "/ 100",
                color: "#D1D5DB",
                size: "md",
                margin: "sm",
                flex: 0
              },
              {
                type: "text",
                text: result.rank,
                color: "#FFE9A7",
                weight: "bold",
                size: "lg",
                align: "end"
              }
            ]
          },
          ...(analysis
            ? [
                {
                  type: "text",
                  text: `鑑定内の参考度 ${confidenceLabel(analysis.confidence)}・一致度 ${Math.round(analysis.consensus * 100)}%`,
                  color: "#D1D5DB",
                  size: "xs",
                  margin: "sm"
                }
              ]
            : [])
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: result.narrative,
            wrap: true,
            size: "md",
            lineSpacing: "6px"
          },
          scoreLine("引き運", result.draw),
          separator(),
          twoColumnLucky(result),
          infoRow(
            "相性のよい機種タイプ",
            result.machineStyle.name,
            result.machineStyle.meaning
          ),
          infoRow(
            "相性メーカー",
            result.compatibleManufacturers.join("／"),
            "占い上の候補です。メーカー各社との提携・推奨関係はありません。"
          ),
          infoRow(
            "ラッキーカラー",
            result.luckyColor.name,
            result.luckyColor.meaning
          ),
          infoRow(
            "ラッキーアイテム",
            result.luckyItem.name,
            result.luckyItem.meaning
          ),
          infoRow(
            "ラッキータイム",
            result.luckyTime,
            "一度区切って判断を見直す時間として意識"
          ),
          guidanceBox(
            "今日の立ち回りテーマ",
            result.theme,
            GOLD_SOFT,
            "#7C5E10"
          ),
          guidanceBox(
            "今日の注意ポイント",
            result.caution,
            "#F7F8FC",
            BRAND
          ),
          ...(analysis?.mainFactors[0]
            ? [
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: "#F7F8FC",
                  cornerRadius: "md",
                  paddingAll: "14px",
                  contents: [
                    {
                      type: "text",
                      text: "今日の主な根拠",
                      color: MUTED,
                      size: "xs"
                    },
                    {
                      type: "text",
                      text: analysis.mainFactors[0],
                      wrap: true,
                      size: "sm",
                      weight: "bold",
                      margin: "sm"
                    }
                  ]
                }
              ]
            : []),
          {
            type: "text",
            text: "占い・娯楽です。設定や勝敗を保証しません。予算と時間を決め、無理のない範囲で遊技してください。",
            wrap: true,
            size: "xxs",
            color: MUTED
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "postback",
                  label: "鑑定の根拠",
                  data: "action=reason"
                }
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "postback",
                  label: "登録情報",
                  data: "action=settings"
                }
              }
            ]
          },
          legalLinks(baseUrl)
        ]
      }
    }
  });
}

export function reasonMessage(
  result: FortuneResult,
  baseUrl: string
): LineMessage {
  const analysis = result.analysis;
  if (!analysis) {
    return withNavigation({
      type: "text",
      text: "この結果には詳細な根拠情報がありません。今日のスロ運を開き直すと、最新方式で再計算されます。"
    });
  }

  return withNavigation({
    type: "flex",
    altText: "今日の鑑定根拠",
    contents: {
      type: "bubble",
      header: brandHeader("鑑定の根拠"),
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "22px",
        contents: [
          summaryPill(
            "鑑定内の参考度",
            confidenceLabel(analysis.confidence),
            "入力情報と有効な判定規則の量を示す内部指標"
          ),
          summaryPill(
            "鑑定内の一致度",
            `${Math.round(analysis.consensus * 100)}%`,
            "複数の中間指標が同じ方向を向いている度合い"
          ),
          separator(),
          reasonList("主な要因", analysis.mainFactors),
          reasonList(
            "判断が分かれた点",
            analysis.conflicts.length > 0
              ? analysis.conflicts
              : ["大きな対立は検出されませんでした"]
          ),
          {
            type: "text",
            text: `内部ルール ${analysis.sourceRuleIds.length}件・参照資料群 ${analysis.sourceIds.length}件`,
            wrap: true,
            size: "xs",
            color: MUTED
          },
          {
            type: "text",
            text: "暦上の事実とヒキヨミ独自の変換規則を区別して保存しています。一致度は勝率や的中確率ではありません。",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            action: {
              type: "postback",
              label: "結果へ戻る",
              data: "action=fortune"
            }
          },
          legalLinks(baseUrl)
        ]
      }
    }
  });
}

function withNavigation(message: LineMessage): LineMessage {
  return {
    ...message,
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "postback",
            label: "今日のスロ運",
            data: "action=fortune",
            displayText: "今日のスロ運"
          }
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "登録情報",
            data: "action=settings",
            displayText: "登録情報"
          }
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "使い方",
            data: "action=help",
            displayText: "使い方"
          }
        }
      ]
    }
  };
}

function brandHeader(subtitle: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: BRAND,
    paddingAll: "20px",
    contents: [
      {
        type: "text",
        text: "ヒキヨミ",
        color: "#FFFFFF",
        weight: "bold",
        size: "xl"
      },
      {
        type: "text",
        text: subtitle,
        color: "#E5E7EB",
        size: "sm",
        margin: "sm"
      }
    ]
  };
}

function scoreLine(label: string, value: number): Record<string, unknown> {
  return {
    type: "box",
    layout: "horizontal",
    alignItems: "center",
    contents: [
      { type: "text", text: label, size: "sm", color: MUTED, flex: 4 },
      {
        type: "text",
        text: String(value),
        size: "sm",
        weight: "bold",
        align: "end",
        flex: 1
      },
      {
        type: "box",
        layout: "vertical",
        backgroundColor: BORDER,
        height: "8px",
        cornerRadius: "4px",
        margin: "md",
        flex: 5,
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: value >= 70 ? GOLD : BRAND_SOFT,
            width: `${value}%`,
            height: "8px",
            cornerRadius: "4px",
            contents: []
          }
        ]
      }
    ]
  };
}

function twoColumnLucky(result: FortuneResult): Record<string, unknown> {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    contents: [
      miniValue("ラッキー末尾", String(result.luckyDigit)),
      miniValue("意識する数字", result.luckyNumbers.join("・"))
    ]
  };
}

function miniValue(label: string, value: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: "#F7F8FC",
    cornerRadius: "md",
    paddingAll: "12px",
    flex: 1,
    contents: [
      { type: "text", text: label, color: MUTED, size: "xs" },
      {
        type: "text",
        text: value,
        weight: "bold",
        size: "xl",
        margin: "sm"
      }
    ]
  };
}

function infoRow(
  label: string,
  value: string,
  detail: string
): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    spacing: "xs",
    contents: [
      { type: "text", text: label, color: MUTED, size: "xs" },
      { type: "text", text: value, weight: "bold", size: "md", wrap: true },
      { type: "text", text: detail, color: MUTED, size: "xs", wrap: true }
    ]
  };
}

function guidanceBox(
  label: string,
  value: string,
  backgroundColor: string,
  labelColor: string
): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor,
    cornerRadius: "md",
    paddingAll: "14px",
    contents: [
      {
        type: "text",
        text: label,
        color: labelColor,
        size: "xs",
        weight: "bold"
      },
      {
        type: "text",
        text: value,
        wrap: true,
        weight: "bold",
        margin: "sm"
      }
    ]
  };
}

function summaryPill(
  label: string,
  value: string,
  detail: string
): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: "#F7F8FC",
    cornerRadius: "md",
    paddingAll: "14px",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: label, color: MUTED, size: "sm" },
          {
            type: "text",
            text: value,
            weight: "bold",
            align: "end",
            color: BRAND
          }
        ]
      },
      {
        type: "text",
        text: detail,
        wrap: true,
        size: "xs",
        color: MUTED,
        margin: "sm"
      }
    ]
  };
}

function reasonList(
  title: string,
  items: readonly string[]
): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [
      { type: "text", text: title, weight: "bold", color: BRAND },
      ...items.slice(0, 4).map((item) => ({
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          { type: "text", text: "•", flex: 0, color: GOLD },
          { type: "text", text: item, wrap: true, size: "sm", color: MUTED }
        ]
      }))
    ]
  };
}

function legalLinks(baseUrl: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "uri",
          label: "利用規約",
          uri: `${baseUrl}/terms`
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "uri",
          label: "プライバシー",
          uri: `${baseUrl}/privacy`
        }
      }
    ]
  };
}

function separator(): Record<string, unknown> {
  return { type: "separator", color: BORDER };
}

function confidenceLabel(value: FortuneAnalysis["confidence"]): string {
  if (value === "high") return "高";
  if (value === "medium") return "中";
  return "低";
}

function formatDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
