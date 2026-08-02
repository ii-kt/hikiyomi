import type { LineMessage } from "./types";

const BRAND = "#11153D";
const MUTED = "#6B7280";

export function fortuneModeMessage(birthTimeKnown: boolean): LineMessage {
  const optionalBirthTime = birthTimeKnown
    ? []
    : [
        {
          type: "separator",
          margin: "lg"
        },
        {
          type: "text",
          text: "出生時刻は任意です。追加するとガチ読みに時支の根拠が増えます。",
          wrap: true,
          size: "xs",
          color: MUTED,
          margin: "lg"
        },
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "postback",
            label: "出生時刻を任意で追加",
            data: "action=edit_birthtime",
            displayText: "出生時刻を追加"
          }
        }
      ];

  return {
    type: "flex",
    altText: "スロ運の読み方を選んでください",
    contents: {
      type: "bubble",
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
            size: "xl"
          },
          {
            type: "text",
            text: "読み方を選ぶ",
            color: "#E5E7EB",
            size: "sm",
            margin: "sm"
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
            text: "点数と相性要素を5秒で確認",
            align: "center",
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
            text: "占術的な根拠と「要はスロットでいうと」まで読む",
            align: "center",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          ...optionalBirthTime
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
