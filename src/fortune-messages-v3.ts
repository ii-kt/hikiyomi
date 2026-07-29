import type { FortuneResult, LineMessage } from "./types";

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
          }
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
          luckyDigitCard(result.luckyDigit),
          infoRow(
            "今日のおすすめスロットタイプ",
            result.machineStyle.name,
            `${result.machineStyle.meaning}。実際の設定・勝率を示すものではありません。`
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
            "占い上の区切り時刻です。遊技継続の根拠にはしないでください。"
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
          {
            type: "text",
            text: "暦・数の規則を使った娯楽占いです。設定、出玉、勝敗、収支を予測しません。時間と予算を事前に決めてください。",
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
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "postback",
              label: "登録情報",
              data: "action=settings"
            }
          },
          legalLinks(baseUrl)
        ]
      }
    }
  });
}

export function reasonMessage(
  _result: FortuneResult,
  _baseUrl: string
): LineMessage {
  return withNavigation({
    type: "text",
    text: "鑑定の根拠は利用者向け画面から外しました。暦上の干支・五行・陰陽と数の規則を計算し、スロット向けの表示はヒキヨミ独自の象徴変換で作っています。勝率や設定を予測する根拠ではありません。"
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

function luckyDigitCard(value: number): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: "#F7F8FC",
    cornerRadius: "md",
    paddingAll: "14px",
    contents: [
      { type: "text", text: "ラッキー末尾", color: MUTED, size: "xs" },
      {
        type: "text",
        text: String(value),
        weight: "bold",
        size: "3xl",
        margin: "sm"
      },
      {
        type: "text",
        text: "同条件で迷ったときの娯楽上の目印",
        color: MUTED,
        size: "xs",
        margin: "xs"
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

function formatDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
