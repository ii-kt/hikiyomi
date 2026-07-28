import { cutoffDateForAdult } from "./date";
import type { FortuneResult, LineMessage } from "./types";

const BRAND = "#11153D";
const GOLD = "#D6A92F";
const MUTED = "#6B7280";

export function ageConfirmationMessage(): LineMessage {
  return {
    type: "flex",
    altText: "ヒキヨミは18歳以上向けのスロット占いです",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: BRAND,
        paddingAll: "20px",
        contents: [
          { type: "text", text: "ヒキヨミ", color: "#FFFFFF", weight: "bold", size: "xl" },
          { type: "text", text: "毎日のスロット占い", color: "#E5E7EB", size: "sm", margin: "sm" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "このサービスは18歳以上の方が対象です。", wrap: true, weight: "bold" },
          { type: "text", text: "占い・娯楽として提供し、実際の設定や遊技結果を保証するものではありません。", wrap: true, size: "sm", color: MUTED }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: BRAND,
            action: { type: "postback", label: "18歳以上です", data: "action=adult_yes", displayText: "18歳以上です" }
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "postback", label: "18歳未満です", data: "action=adult_no", displayText: "18歳未満です" }
          }
        ]
      }
    }
  };
}

export function birthDateMessage(): LineMessage {
  return {
    type: "flex",
    altText: "生年月日を登録してください",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          { type: "text", text: "生年月日を登録", weight: "bold", size: "xl" },
          { type: "text", text: "本人専用の日運を計算するために使用します。LINE上には公開されません。", wrap: true, size: "sm", color: MUTED },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            margin: "lg",
            action: {
              type: "datetimepicker",
              label: "生年月日を選ぶ",
              data: "action=set_birthdate",
              mode: "date",
              max: cutoffDateForAdult(),
              initial: "1990-01-01"
            }
          },
          { type: "text", text: "例：1996/04/18 とメッセージで送っても登録できます。", wrap: true, size: "xs", color: MUTED }
        ]
      }
    }
  };
}

export function registeredMessage(): LineMessage {
  return {
    type: "flex",
    altText: "登録が完了しました。今日のスロ運を見られます",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          { type: "text", text: "登録完了", weight: "bold", size: "xl" },
          { type: "text", text: "準備ができました。今日の結果は同じ日に何度見ても変わりません。", wrap: true, size: "sm", color: MUTED },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            margin: "lg",
            action: { type: "postback", label: "今日のスロ運を見る", data: "action=fortune", displayText: "今日のスロ運" }
          }
        ]
      }
    }
  };
}

export function fortuneMessage(result: FortuneResult): LineMessage {
  return {
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
          { type: "text", text: `${formatDate(result.date)}のスロ運`, color: "#E5E7EB", size: "sm" },
          {
            type: "box",
            layout: "baseline",
            margin: "md",
            contents: [
              { type: "text", text: String(result.overall), color: "#FFFFFF", weight: "bold", size: "5xl", flex: 0 },
              { type: "text", text: "/ 100", color: "#D1D5DB", size: "md", margin: "sm", flex: 0 },
              { type: "text", text: result.rank, color: "#FFE9A7", weight: "bold", size: "lg", align: "end" }
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
          { type: "text", text: result.narrative, wrap: true, size: "md", lineSpacing: "6px" },
          scoreGrid(result),
          separator(),
          infoRow("ラッキー末尾", String(result.luckyDigit), "同条件の候補で迷ったときの遊び要素"),
          infoRow("意識する数字", result.luckyNumbers.join("・"), "時刻や番号で目に入ったときの小さな合図"),
          infoRow("ラッキーカラー", result.luckyColor.name, result.luckyColor.meaning),
          infoRow("ラッキーアイテム", result.luckyItem.name, result.luckyItem.meaning),
          infoRow("機種タイプ", result.machineStyle.name, result.machineStyle.meaning),
          infoRow("ラッキータイム", result.luckyTime, "判断を一度見直す時間として意識"),
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F4F1E8",
            cornerRadius: "md",
            paddingAll: "14px",
            contents: [
              { type: "text", text: "今日のテーマ", color: "#7C5E10", size: "xs", weight: "bold" },
              { type: "text", text: result.theme, wrap: true, weight: "bold", margin: "sm" }
            ]
          },
          { type: "text", text: "占い・娯楽です。設定や勝敗を保証しません。予算と時間を決め、無理のない範囲で遊技してください。", wrap: true, size: "xxs", color: MUTED }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: { type: "postback", label: "今日の結果をもう一度見る", data: "action=fortune", displayText: "今日のスロ運" }
          }
        ]
      }
    }
  };
}

export function simpleText(text: string): LineMessage {
  return { type: "text", text };
}

function scoreGrid(result: FortuneResult): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [
      scoreLine("引き運", result.draw),
      scoreLine("台選び運", result.selection),
      scoreLine("流れ運", result.flow),
      scoreLine("冷静さ運", result.calmness)
    ]
  };
}

function scoreLine(label: string, value: number): Record<string, unknown> {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "sm", color: MUTED, flex: 4 },
      { type: "text", text: String(value), size: "sm", weight: "bold", align: "end", flex: 1 },
      {
        type: "box",
        layout: "vertical",
        backgroundColor: "#E5E7EB",
        height: "8px",
        cornerRadius: "4px",
        margin: "md",
        flex: 5,
        justifyContent: "center",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: value >= 70 ? GOLD : BRAND,
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

function infoRow(label: string, value: string, detail: string): Record<string, unknown> {
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

function separator(): Record<string, unknown> {
  return { type: "separator", color: "#E5E7EB" };
}

function formatDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
