import { cutoffDateForAdult } from "./date";
import type { LineMessage, UserRecord } from "./types";

const BRAND = "#11153D";
const MUTED = "#6B7280";
const DANGER = "#A51D2D";

export function birthDateMessage(
  baseUrl: string,
  edit = false
): LineMessage {
  return withNavigation({
    type: "flex",
    altText: edit
      ? "生年月日を変更してください"
      : "生年月日を登録してください",
    contents: {
      type: "bubble",
      header: brandHeader(edit ? "登録情報を変更" : "初回登録"),
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          {
            type: "text",
            text: edit ? "生年月日を変更" : "生年月日を登録",
            weight: "bold",
            size: "xl"
          },
          {
            type: "text",
            text: "日ごとの占い計算と18歳以上の確認に使用します。出生時刻は不要で、登録後すぐ利用できます。",
            wrap: true,
            size: "sm",
            color: MUTED
          },
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
          {
            type: "text",
            text: "1996/04/18 のようにメッセージで送ることもできます。変更すると保存済みの占い結果を再計算します。",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          legalNotice(baseUrl)
        ]
      }
    }
  });
}

export function birthTimeMessage(
  baseUrl: string,
  edit = false
): LineMessage {
  if (!edit) return registeredMessage(baseUrl);

  return withNavigation({
    type: "flex",
    altText: "出生時刻を任意で登録できます",
    contents: {
      type: "bubble",
      header: brandHeader("任意情報"),
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          {
            type: "text",
            text: "出生時刻を任意で登録",
            weight: "bold",
            size: "xl"
          },
          {
            type: "text",
            text: "分かる場合だけ追加できます。覚えていない場合は調べる必要はありません。未登録でも減点や利用制限はありません。",
            wrap: true,
            size: "sm",
            color: MUTED
          },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            margin: "lg",
            action: {
              type: "datetimepicker",
              label: "出生時刻を選ぶ",
              data: "action=set_birthtime",
              mode: "time",
              initial: "12:00"
            }
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "登録しない",
              data: "action=birthtime_unknown",
              displayText: "出生時刻は登録しない"
            }
          },
          {
            type: "text",
            text: "14:20 のようにメッセージで送ることもできます。変更後は保存済みの占い結果を再計算します。",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          legalNotice(baseUrl)
        ]
      }
    }
  });
}

export function registeredMessage(baseUrl: string): LineMessage {
  return withNavigation({
    type: "flex",
    altText: "登録が完了しました。今日のスロ運を見られます",
    contents: {
      type: "bubble",
      header: brandHeader("登録完了"),
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          {
            type: "text",
            text: "準備ができました",
            weight: "bold",
            size: "xl"
          },
          {
            type: "text",
            text: "生年月日だけで利用できます。同じ日の結果は何度見ても変わりません。出生時刻は登録情報から任意で追加できます。",
            wrap: true,
            size: "sm",
            color: MUTED
          },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            margin: "lg",
            action: {
              type: "postback",
              label: "今日のスロ運を見る",
              data: "action=fortune",
              displayText: "今日のスロ運"
            }
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "登録内容を確認",
              data: "action=settings",
              displayText: "登録情報"
            }
          },
          legalNotice(baseUrl)
        ]
      }
    }
  });
}

export function settingsMessage(
  user: UserRecord,
  baseUrl: string
): LineMessage {
  const birthTimeKnown = user.birth_time_known === 1 && Boolean(user.birth_time);
  const birthTime = birthTimeKnown ? user.birth_time ?? "" : "未登録（任意）";

  return withNavigation({
    type: "flex",
    altText: "登録情報の確認と変更",
    contents: {
      type: "bubble",
      header: brandHeader("登録情報"),
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "22px",
        contents: [
          valueCard("生年月日", formatFullDate(user.birth_date ?? "")),
          valueCard("出生時刻", birthTime),
          {
            type: "text",
            text: "出生時刻は任意です。登録内容を変更すると、保存済みの占い結果は新しい情報で再計算されます。",
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
              label: "生年月日を変更",
              data: "action=edit_birthdate",
              displayText: "生年月日を変更"
            }
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: birthTimeKnown ? "出生時刻を変更" : "出生時刻を任意で追加",
              data: "action=edit_birthtime",
              displayText: birthTimeKnown ? "出生時刻を変更" : "出生時刻を追加"
            }
          },
          {
            type: "button",
            style: "link",
            color: DANGER,
            action: {
              type: "postback",
              label: "登録情報を削除",
              data: "action=delete_confirm"
            }
          },
          legalNotice(baseUrl)
        ]
      }
    }
  });
}

export function deleteConfirmationMessage(): LineMessage {
  return {
    type: "flex",
    altText: "登録情報を削除しますか",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          {
            type: "text",
            text: "登録情報を削除しますか？",
            weight: "bold",
            size: "xl"
          },
          {
            type: "text",
            text: "生年月日、任意で登録した出生時刻、保存済みの占い結果を削除します。この操作は元に戻せません。",
            wrap: true,
            size: "sm",
            color: MUTED
          },
          {
            type: "button",
            style: "primary",
            color: DANGER,
            margin: "lg",
            action: {
              type: "postback",
              label: "削除する",
              data: "action=delete_account",
              displayText: "登録情報を削除"
            }
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "削除しない",
              data: "action=settings"
            }
          }
        ]
      }
    }
  };
}

export function dataDeletedMessage(baseUrl: string): LineMessage {
  return withNavigation({
    type: "flex",
    altText: "登録情報を削除しました",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "22px",
        contents: [
          {
            type: "text",
            text: "登録情報を削除しました",
            weight: "bold",
            size: "xl"
          },
          {
            type: "text",
            text: "再び利用するときは、生年月日から登録し直してください。",
            wrap: true,
            size: "sm",
            color: MUTED
          },
          {
            type: "button",
            style: "primary",
            color: BRAND,
            action: {
              type: "postback",
              label: "もう一度登録する",
              data: "action=start_registration"
            }
          },
          legalNotice(baseUrl)
        ]
      }
    }
  });
}

export function helpMessage(baseUrl: string): LineMessage {
  return withNavigation({
    type: "flex",
    altText: "ヒキヨミの使い方",
    contents: {
      type: "bubble",
      header: brandHeader("使い方"),
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "22px",
        contents: [
          guideStep(
            "1",
            "生年月日だけ登録",
            "出生時刻は不要です。分かる場合だけ、後から任意で追加できます。"
          ),
          guideStep(
            "2",
            "今日のスロ運",
            "総合スロ運、引き運、スロットタイプ、相性メーカー、ラッキー末尾、遊び方の目安が届きます。"
          ),
          guideStep(
            "3",
            "占いとして楽しむ",
            "結果は設定や勝率の予測ではありません。実際の判断では時間と予算を優先してください。"
          ),
          {
            type: "button",
            style: "primary",
            color: BRAND,
            action: {
              type: "postback",
              label: "今日のスロ運を見る",
              data: "action=fortune",
              displayText: "今日のスロ運"
            }
          },
          legalLinks(baseUrl)
        ]
      }
    }
  });
}

export function unknownMessage(): LineMessage {
  return withNavigation({
    type: "text",
    text: "その内容は自由会話として処理していません。下のメニューから操作してください。"
  });
}

export function simpleText(text: string): LineMessage {
  return { type: "text", text };
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

function valueCard(label: string, value: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: "#F7F8FC",
    cornerRadius: "md",
    paddingAll: "14px",
    contents: [
      { type: "text", text: label, color: MUTED, size: "xs" },
      {
        type: "text",
        text: value,
        weight: "bold",
        size: "lg",
        margin: "sm"
      }
    ]
  };
}

function guideStep(
  number: string,
  title: string,
  detail: string
): Record<string, unknown> {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    contents: [
      {
        type: "box",
        layout: "vertical",
        width: "30px",
        height: "30px",
        backgroundColor: BRAND,
        cornerRadius: "15px",
        justifyContent: "center",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: number,
            color: "#FFFFFF",
            weight: "bold",
            align: "center"
          }
        ]
      },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        contents: [
          { type: "text", text: title, weight: "bold" },
          {
            type: "text",
            text: detail,
            wrap: true,
            size: "sm",
            color: MUTED,
            margin: "xs"
          }
        ]
      }
    ]
  };
}

function legalNotice(baseUrl: string): Record<string, unknown> {
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    margin: "md",
    contents: [
      {
        type: "text",
        text: "登録・利用により利用規約とプライバシーポリシーに同意したものとして扱います。",
        wrap: true,
        size: "xxs",
        color: MUTED
      },
      legalLinks(baseUrl)
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

function formatFullDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "未登録";
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}
