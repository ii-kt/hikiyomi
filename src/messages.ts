import { cutoffDateForAdult } from "./date";
import type {
  FortuneAnalysis,
  FortuneResult,
  LineMessage,
  UserRecord
} from "./types";

const BRAND = "#11153D";
const BRAND_SOFT = "#20275A";
const GOLD = "#D6A92F";
const GOLD_SOFT = "#F4F1E8";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
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
            text: "本人専用の日運計算と18歳以上の確認に使用します。LINEのプロフィールやトーク上には公開されません。",
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
            text: "1996/04/18 のようにメッセージで送ることもできます。変更すると当日の結果を含む保存済み占いを再計算します。",
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
  return withNavigation({
    type: "flex",
    altText: "出生時刻を登録するか、不明を選択してください",
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
            text: edit ? "出生時刻を変更" : "出生時刻",
            weight: "bold",
            size: "xl"
          },
          {
            type: "text",
            text: "分かる場合は十二支の時刻区分として個人化に使います。分からなくても減点や不利益はありません。",
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
              label: "出生時刻は分からない",
              data: "action=birthtime_unknown",
              displayText: "出生時刻は分からない"
            }
          },
          {
            type: "text",
            text: "14:20 のようにメッセージで送ることもできます。変更後は保存済み占いを再計算します。",
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
            text: "同じ日の結果は何度見ても変わりません。出生時刻が不明でも、利用できる情報だけで計算します。",
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
  const birthTime =
    user.birth_time_known === 1 && user.birth_time
      ? user.birth_time
      : "不明として登録";

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
            text: "登録内容を変更すると、保存済みの占い結果は新しい情報で再計算されます。",
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
              label: "出生時刻を変更",
              data: "action=edit_birthtime",
              displayText: "出生時刻を変更"
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
            text: "生年月日、出生時刻、保存済みの占い結果を削除します。この操作は元に戻せません。",
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
          guideStep("1", "初回だけ登録", "生年月日と、分かる場合は出生時刻を登録します。"),
          guideStep("2", "今日のスロ運", "メニューを押すと、同日固定の結果が1枚で届きます。"),
          guideStep("3", "根拠を確認", "結果カードの「鑑定の根拠」で、主因・合議度・矛盾を確認できます。"),
          {
            type: "text",
            text: "ヒキヨミは娯楽占いです。実際の設定、出玉、勝敗、収支は予測・保証しません。",
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
                  text: `参考度 ${confidenceLabel(analysis.confidence)}・合議度 ${Math.round(analysis.consensus * 100)}%`,
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
          scoreGrid(result),
          separator(),
          twoColumnLucky(result),
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
            "相性のよい機種タイプ",
            result.machineStyle.name,
            result.machineStyle.meaning
          ),
          infoRow(
            "ラッキータイム",
            result.luckyTime,
            "判断を一度見直す時間として意識"
          ),
          {
            type: "box",
            layout: "vertical",
            backgroundColor: GOLD_SOFT,
            cornerRadius: "md",
            paddingAll: "14px",
            contents: [
              {
                type: "text",
                text: "今日のテーマ",
                color: "#7C5E10",
                size: "xs",
                weight: "bold"
              },
              {
                type: "text",
                text: result.theme,
                wrap: true,
                weight: "bold",
                margin: "sm"
              }
            ]
          },
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
    return simpleText(
      "この結果には詳細な根拠情報がありません。今日のスロ運を開き直すと、最新方式で再計算されます。"
    );
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
            "参考度",
            confidenceLabel(analysis.confidence),
            "入力情報と有効な判定規則の量から決定"
          ),
          summaryPill(
            "合議度",
            `${Math.round(analysis.consensus * 100)}%`,
            "複数の中間指標が同じ方向を向いている度合い"
          ),
          separator(),
          reasonList("主な要因", analysis.mainFactors),
          reasonList(
            "判定が分かれた点",
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
            text: "暦上の事実とヒキヨミ独自の点数変換を区別して保存しています。これは勝敗予測の確率ではありません。",
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

function formatFullDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "未登録";
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}
