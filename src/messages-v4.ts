import { birthLocationLabel } from "./birth-location";
import {
  birthDateMessage,
  birthTimeMessage,
  dataDeletedMessage,
  deleteConfirmationMessage,
  helpMessage,
  registeredMessage,
  simpleText,
  unknownMessage
} from "./messages-v3";
import type { LineMessage, UserRecord } from "./types";

export {
  birthDateMessage,
  birthTimeMessage,
  dataDeletedMessage,
  deleteConfirmationMessage,
  helpMessage,
  registeredMessage,
  simpleText,
  unknownMessage
};

const BRAND = "#11153D";
const MUTED = "#6B7280";
const DANGER = "#A51D2D";

export function settingsMessage(user: UserRecord, baseUrl: string): LineMessage {
  const birthTimeKnown = user.birth_time_known === 1 && Boolean(user.birth_time);
  const birthTime = birthTimeKnown ? user.birth_time ?? "" : "未登録（任意）";
  const birthplace = birthLocationLabel(user);

  return {
    type: "flex",
    altText: "登録情報の確認と変更",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: BRAND,
        paddingAll: "20px",
        contents: [
          { type: "text", text: "ヒキヨミ", color: "#FFFFFF", weight: "bold", size: "xl" },
          { type: "text", text: "登録情報", color: "#E5E7EB", size: "sm", margin: "sm" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "22px",
        contents: [
          valueCard("生年月日", formatFullDate(user.birth_date ?? "")),
          valueCard("出生時刻", birthTime),
          valueCard("出生地", birthplace),
          valueCard("今日打つ地域", user.play_location ?? "未設定（任意）"),
          valueCard("遊技予定", user.play_period ?? "未定（任意）"),
          {
            type: "text",
            text: "生年月日は必須です。出生時刻・出生地・今日打つ地域・遊技予定は任意です。地域と予定時間は総合点を変えず、時間帯の説明に使います。",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          button("生年月日を変更", "action=edit_birthdate", "primary"),
          button(birthTimeKnown ? "出生時刻を変更" : "出生時刻を任意で追加", "action=edit_birthtime", "secondary"),
          button(birthplace === "未登録（任意）" ? "出生地を任意で追加" : "出生地を変更", "action=edit_birthlocation", "secondary"),
          button(user.play_location ? "今日打つ地域を変更" : "今日打つ地域を設定", "action=edit_playlocation", "secondary"),
          button(user.play_period ? "遊技予定を変更" : "遊技予定を設定", "action=edit_playperiod", "secondary"),
          {
            type: "button",
            style: "link",
            color: DANGER,
            action: { type: "postback", label: "登録情報を削除", data: "action=delete_confirm" }
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              { type: "button", style: "link", height: "sm", action: { type: "uri", label: "利用規約", uri: `${baseUrl}/terms` } },
              { type: "button", style: "link", height: "sm", action: { type: "uri", label: "プライバシー", uri: `${baseUrl}/privacy` } }
            ]
          }
        ]
      }
    }
  };
}

function valueCard(label: string, value: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: "#F7F8FC",
    cornerRadius: "md",
    paddingAll: "14px",
    contents: [
      { type: "text", text: label, color: MUTED, size: "xs" },
      { type: "text", text: value, weight: "bold", size: "lg", margin: "sm", wrap: true }
    ]
  };
}

function button(label: string, data: string, style: "primary" | "secondary"): Record<string, unknown> {
  return {
    type: "button",
    style,
    ...(style === "primary" ? { color: BRAND } : {}),
    action: { type: "postback", label, data, displayText: label }
  };
}

function formatFullDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "未登録";
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}
