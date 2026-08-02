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
          text: "出生時刻は任意です。分かる場合は追加すると、ガチ読みの鑑定内容が詳しくなります。",
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
            label: "出生時刻を追加する",
            data: "action=edit_birthtime",
            displayText: "出生時刻を追加"
          }
        }
      ];

  return {
    type: "flex",
    altText: "今日のスロ運の表示内容を選んでください",
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
            text: "表示する内容を選んでください",
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
            text: "点数の理由と、スロット向けの解釈まで詳しく表示",
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
