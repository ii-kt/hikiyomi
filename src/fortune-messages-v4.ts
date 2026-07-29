import type { FortuneResult, LineMessage } from "./types";

const BRAND = "#11153D";
const BRAND_SOFT = "#20275A";
const GOLD = "#D6A92F";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

export function fortuneMessage(
  result: FortuneResult,
  _baseUrl: string
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
            result.machineStyle.meaning
          ),
          infoRow(
            "相性メーカー",
            result.compatibleManufacturers.join("／")
          ),
          infoRow(
            "ラッキーカラー",
            result.luckyColor.name,
            result.luckyColor.meaning
          ),
          infoRow("ラッキータイム", result.luckyTime)
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
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
          }
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
    text: "鑑定方法の説明は使い方ページにまとめています。"
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
        text: "同条件で迷ったときの目印",
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
  detail?: string
): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    spacing: "xs",
    contents: [
      { type: "text", text: label, color: MUTED, size: "xs" },
      { type: "text", text: value, weight: "bold", size: "md", wrap: true },
      ...(detail
        ? [{ type: "text", text: detail, color: MUTED, size: "xs", wrap: true }]
        : [])
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
