import type { LineMessage, UserRecord } from "./types";

const BRAND = "#11153D";
const MUTED = "#6B7280";

export function fortuneModeMessage(user: UserRecord): LineMessage {
  const birthTimeKnown = user.birth_time_known === 1 && Boolean(user.birth_time);
  const optionalBirthTime = birthTimeKnown
    ? []
    : [
        { type: "separator", margin: "lg" },
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

  const playLocation = user.play_location ?? "未設定";
  const playPeriod = user.play_period ?? "未定";

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
          { type: "text", text: "今日のスロ運", color: "#FFFFFF", weight: "bold", size: "xl", wrap: true },
          { type: "text", text: "表示する内容を選んでください", color: "#E5E7EB", size: "sm", margin: "sm", wrap: true }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#F7F8FC",
            cornerRadius: "md",
            paddingAll: "12px",
            contents: [
              { type: "text", text: `今日打つ地域：${playLocation}`, size: "xs", color: MUTED, wrap: true },
              { type: "text", text: `遊技予定：${playPeriod}`, size: "xs", color: MUTED, margin: "xs", wrap: true }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "link",
                height: "sm",
                action: { type: "postback", label: "地域を設定", data: "action=edit_playlocation", displayText: "今日打つ地域を設定" }
              },
              {
                type: "button",
                style: "link",
                height: "sm",
                action: { type: "postback", label: "時間を設定", data: "action=edit_playperiod", displayText: "遊技予定を設定" }
              }
            ]
          },
          {
            type: "text",
            text: "地域と予定時間は任意です。総合点は変えず、ラッキータイムと説明をあなたの予定に合わせます。",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            action: { type: "postback", label: "サク読み", data: "action=fortune_quick", displayText: "サク読み" }
          },
          { type: "text", text: "点数と今日のおすすめを簡潔に表示", align: "center", wrap: true, size: "xs", color: MUTED },
          {
            type: "button",
            style: "secondary",
            action: { type: "postback", label: "ガチ読み", data: "action=fortune_deep", displayText: "ガチ読み" }
          },
          { type: "text", text: "点数の理由と、スロット向けの解釈まで詳しく表示", align: "center", wrap: true, size: "xs", color: MUTED },
          ...optionalBirthTime
        ]
      }
    },
    quickReply: {
      items: [
        { type: "action", action: { type: "postback", label: "サク読み", data: "action=fortune_quick", displayText: "サク読み" } },
        { type: "action", action: { type: "postback", label: "ガチ読み", data: "action=fortune_deep", displayText: "ガチ読み" } }
      ]
    }
  };
}
