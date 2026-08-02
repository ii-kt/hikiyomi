import { birthLocationLabel } from "./birth-location";
import type { LineMessage, UserRecord } from "./types";

const BRAND = "#11153D";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

export function fortuneModeMessage(user: UserRecord): LineMessage {
  const birthTime =
    user.birth_time_known === 1 && user.birth_time
      ? user.birth_time
      : "未登録";
  const birthLocation = birthLocationLabel(user).replace("（任意）", "");
  const playLocation = user.play_location ?? "未設定";
  const playPeriod = user.play_period ?? "未定";

  return {
    type: "flex",
    altText: "任意項目を確認して、今日のスロ運を選んでください",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: BRAND,
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "今日のスロ運",
            color: "#FFFFFF",
            weight: "bold",
            size: "xl",
            wrap: true
          },
          {
            type: "text",
            text: "任意項目を確認してください",
            color: "#E5E7EB",
            size: "sm",
            margin: "sm",
            wrap: true
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          {
            type: "text",
            text: "追加できる項目",
            weight: "bold",
            size: "md"
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F7F8FC",
            cornerRadius: "md",
            paddingAll: "14px",
            spacing: "sm",
            contents: [
              optionRow("出生時刻", birthTime),
              optionRow("出生地", birthLocation),
              optionRow("今日打つ地域", playLocation),
              optionRow("遊技予定", playPeriod)
            ]
          },
          {
            type: "text",
            text: "追加・変更しますか？ 未設定のままでも占えます。",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              optionButton("出生時刻", "action=edit_birthtime"),
              optionButton("出生地", "action=edit_birthlocation")
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              optionButton("打つ地域", "action=edit_playlocation"),
              optionButton("遊技予定", "action=edit_playperiod")
            ]
          },
          {
            type: "separator",
            margin: "lg",
            color: BORDER
          },
          {
            type: "text",
            text: "このまま占う",
            weight: "bold",
            size: "md",
            margin: "lg"
          },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            action: {
              type: "postback",
              label: "サク読み",
              data: "action=fortune_quick",
              displayText: "サク読み"
            }
          },
          {
            type: "text",
            text: "点数と今日のおすすめを簡潔に表示",
            align: "center",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "ガチ読み",
              data: "action=fortune_deep",
              displayText: "ガチ読み"
            }
          },
          {
            type: "text",
            text: "点数の理由とスロット向けの解釈まで表示",
            align: "center",
            wrap: true,
            size: "xs",
            color: MUTED
          }
        ]
      }
    },
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "postback",
            label: "サク読み",
            data: "action=fortune_quick",
            displayText: "サク読み"
          }
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "ガチ読み",
            data: "action=fortune_deep",
            displayText: "ガチ読み"
          }
        }
      ]
    }
  };
}

function optionRow(label: string, value: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      {
        type: "text",
        text: label,
        size: "sm",
        color: MUTED,
        flex: 4,
        wrap: true
      },
      {
        type: "text",
        text: value,
        size: "sm",
        weight: "bold",
        align: "end",
        flex: 6,
        wrap: true
      }
    ]
  };
}

function optionButton(label: string, data: string): Record<string, unknown> {
  return {
    type: "button",
    style: "link",
    height: "sm",
    action: {
      type: "postback",
      label,
      data,
      displayText: `${label}を設定`
    }
  };
}
