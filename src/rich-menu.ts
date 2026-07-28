export const RICH_MENU_WIDTH = 2500;
export const RICH_MENU_HEIGHT = 843;
export const RICH_MENU_NAME_PREFIX = "hikiyomi-main-";

export interface RichMenuDefinition {
  size: { width: number; height: number };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    action: Record<string, unknown>;
  }>;
}

export function createRichMenuDefinition(
  version = "v1"
): RichMenuDefinition {
  return {
    size: { width: RICH_MENU_WIDTH, height: RICH_MENU_HEIGHT },
    selected: true,
    name: `${RICH_MENU_NAME_PREFIX}${version}`,
    chatBarText: "ヒキヨミメニュー",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 834, height: RICH_MENU_HEIGHT },
        action: {
          type: "postback",
          label: "今日のスロ運",
          data: "action=fortune",
          displayText: "今日のスロ運"
        }
      },
      {
        bounds: { x: 834, y: 0, width: 833, height: RICH_MENU_HEIGHT },
        action: {
          type: "postback",
          label: "登録情報",
          data: "action=settings",
          displayText: "登録情報"
        }
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: RICH_MENU_HEIGHT },
        action: {
          type: "postback",
          label: "使い方",
          data: "action=help",
          displayText: "使い方"
        }
      }
    ]
  };
}
