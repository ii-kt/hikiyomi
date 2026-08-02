import type { LineMessage, UserRecord } from "./types";

const BRAND = "#11153D";
const MUTED = "#6B7280";

export interface BirthLocationData {
  label: string;
}

export function birthLocationMessage(): LineMessage {
  return {
    type: "flex",
    altText: "出生地を任意で登録できます",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: BRAND,
        paddingAll: "20px",
        contents: [
          { type: "text", text: "出生地（任意）", color: "#FFFFFF", weight: "bold", size: "xl" }
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
            text: "生まれた市区町村名をそのまま送ってください。例：○○市",
            wrap: true,
            size: "sm",
            color: MUTED
          },
          {
            type: "text",
            text: "現在は登録情報として保存します。正式な経度・時差補正を実装するまでは点数計算に使用しません。",
            wrap: true,
            size: "xs",
            color: MUTED
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "postback", label: "登録情報へ戻る", data: "action=settings" }
          }
        ]
      }
    }
  };
}

export function normalizeBirthLocationText(text: string): string | null {
  const value = text.trim().replace(/\s+/g, " ");
  if (value.length < 2 || value.length > 80) return null;
  if (!/(?:市|区|町|村)$/.test(value)) return null;
  return value;
}

export function birthLocationLabel(user: UserRecord): string {
  if (!user.birth_location_json) return "未登録（任意）";
  try {
    const parsed = JSON.parse(user.birth_location_json) as Partial<BirthLocationData>;
    return typeof parsed.label === "string" && parsed.label ? parsed.label : "未登録（任意）";
  } catch {
    return "未登録（任意）";
  }
}
