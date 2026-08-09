import type {
  FortuneReadingMode,
  FortuneResult,
  FortuneSystemReading,
  LineMessage
} from "./types";

const BRAND = "#11153D";
const BRAND_SOFT = "#20275A";
const GOLD = "#D6A92F";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

export function fortuneMessages(
  result: FortuneResult,
  baseUrl: string,
  mode: FortuneReadingMode
): LineMessage[] {
  const quick = fortuneMessage(result, baseUrl);
  if (mode === "quick") return [quick];
  return [quick, deepReadingMessage(result)];
}

export function fortuneMessage(
  result: FortuneResult,
  _baseUrl: string
): LineMessage {
  return withNavigation({
    type: "flex",
    altText: `${result.date}のスロ運は${result.overall}点・${result.rank}です`,
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
            text: `${formatDate(result.date)}のスロ運`,
            color: "#E5E7EB",
            size: "sm",
            wrap: true
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
                flex: 0,
                adjustMode: "shrink-to-fit"
              },
              {
                type: "text",
                text: "/ 100",
                color: "#D1D5DB",
                size: "md",
                margin: "sm",
                flex: 0,
                adjustMode: "shrink-to-fit"
              },
              {
                type: "text",
                text: result.rank,
                color: "#FFE9A7",
                weight: "bold",
                size: "lg",
                align: "end",
                wrap: true,
                adjustMode: "shrink-to-fit"
              }
            ]
          },
          scorePosition(result)
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
            result.compatibleManufacturers.join("\n")
          ),
          infoRow(
            "ラッキーカラー",
            result.luckyColor.name,
            result.luckyColor.meaning
          ),
          ...(result.luckyItem
            ? [infoRow("ラッキーアイテム", result.luckyItem.name, result.luckyItem.meaning)]
            : []),
          ...(result.luckyDrink
            ? [infoRow("相性ドリンク", result.luckyDrink.name, result.luckyDrink.meaning)]
            : []),
          infoRow("ラッキータイム", result.luckyTime)
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
            height: "sm",
            action: {
              type: "postback",
              label: "ガチ読みを見る",
              data: "action=fortune_deep",
              displayText: "ガチ読み"
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
      }
    }
  });
}

export function reasonMessage(
  result: FortuneResult,
  _baseUrl: string
): LineMessage {
  return deepReadingMessage(result);
}

function deepReadingMessage(result: FortuneResult): LineMessage {
  const analysis = result.analysis;
  const systems = analysis?.systems ?? [];
  const scale = analysis?.scoreScale;
  const position = scale
    ? `${scale.year}年の${scale.totalDays}日中、上位${scale.rankFromTop}位`
    : "年間位置は未計算";
  const slotSummary =
    analysis?.slotSummary ??
    "今日は自分のヒキを信じて、いつものペースで楽しむ日です。";

  const systemText =
    systems.length > 0
      ? systems.map(formatSystemReading).join("\n\n")
      : "保存済み結果に詳細な占術内訳がありません。今日のスロ運を再表示すると最新方式で再計算されます。";

  const birthTimeNote =
    analysis?.birthTimeUsed === false
      ? "\n\n【任意情報】\n出生時刻は未登録です。分かる場合は追加すると、時刻に関する鑑定根拠が増えます。"
      : "";

  const luckyExtras = [
    result.luckyItem ? `アイテム：${result.luckyItem.name}` : null,
    result.luckyDrink ? `ドリンク：${result.luckyDrink.name}` : null
  ].filter((value): value is string => value !== null);

  return withNavigation({
    type: "text",
    text:
      `【${formatDate(result.date)}のガチ読み】\n` +
      `総合スロ運 ${result.overall}/100（${result.rank}）\n` +
      `${position}\n\n` +
      `【今日のヒキヨミ】\n${slotSummary}\n\n` +
      `【占術的な根拠】\n${systemText}\n\n` +
      `【今日の相性まとめ】\n` +
      `おすすめ：${result.machineStyle.name}\n` +
      `メーカー：${result.compatibleManufacturers.join("／")}\n` +
      `末尾：${result.luckyDigit}\n` +
      `カラー：${result.luckyColor.name}\n` +
      (luckyExtras.length > 0 ? `${luckyExtras.join("\n")}\n` : "") +
      `時間：${result.luckyTime}` +
      birthTimeNote
  });
}

function formatSystemReading(reading: FortuneSystemReading): string {
  return (
    `■ ${reading.label}（${reading.score}/100）\n` +
    `${reading.basis}\n` +
    `${reading.slotTranslation}`
  );
}

function scorePosition(result: FortuneResult): Record<string, unknown> {
  const scale = result.analysis?.scoreScale;
  if (!scale) {
    return {
      type: "text",
      text: "個人運の0〜100点換算",
      color: "#D1D5DB",
      size: "xs",
      margin: "sm",
      wrap: true
    };
  }

  return {
    type: "text",
    text: `${scale.year}年 ${scale.totalDays}日中 上位${scale.rankFromTop}位`,
    color: "#D1D5DB",
    size: "xs",
    margin: "sm",
    wrap: true
  };
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
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "登録情報",
            data: "action=settings",
            displayText: "登録情報"
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
      {
        type: "text",
        text: label,
        size: "sm",
        color: MUTED,
        flex: 3,
        wrap: true
      },
      {
        type: "text",
        text: String(value),
        size: "sm",
        weight: "bold",
        align: "end",
        flex: 1,
        adjustMode: "shrink-to-fit"
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
            backgroundColor: value >= 75 ? GOLD : BRAND_SOFT,
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
      {
        type: "text",
        text: "ラッキー末尾",
        color: MUTED,
        size: "xs",
        wrap: true
      },
      {
        type: "text",
        text: String(value),
        weight: "bold",
        size: "3xl",
        margin: "sm",
        adjustMode: "shrink-to-fit"
      },
      {
        type: "text",
        text: "同条件で迷ったときの目印",
        color: MUTED,
        size: "xs",
        margin: "xs",
        wrap: true
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
      {
        type: "text",
        text: label,
        color: MUTED,
        size: "xs",
        wrap: true
      },
      {
        type: "text",
        text: value,
        weight: "bold",
        size: "md",
        wrap: true
      },
      ...(detail
        ? [
            {
              type: "text",
              text: detail,
              color: MUTED,
              size: "xs",
              wrap: true
            }
          ]
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
