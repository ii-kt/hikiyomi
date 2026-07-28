import { describe, expect, it } from "vitest";
import {
  createRichMenuDefinition,
  RICH_MENU_HEIGHT,
  RICH_MENU_WIDTH
} from "../src/rich-menu";

describe("LINE rich menu", () => {
  it("uses an uploadable LINE rich menu canvas", () => {
    const menu = createRichMenuDefinition("test");
    expect(menu.size).toEqual({
      width: RICH_MENU_WIDTH,
      height: RICH_MENU_HEIGHT
    });
    expect(menu.size.width).toBeGreaterThanOrEqual(800);
    expect(menu.size.width).toBeLessThanOrEqual(2500);
    expect(menu.size.height).toBeGreaterThanOrEqual(250);
    expect(menu.size.width / menu.size.height).toBeGreaterThanOrEqual(1.45);
    expect(menu.chatBarText.length).toBeLessThanOrEqual(14);
  });

  it("covers the entire canvas once with three adjacent actions", () => {
    const menu = createRichMenuDefinition("test");
    const sorted = [...menu.areas].sort((a, b) => a.bounds.x - b.bounds.x);

    expect(sorted).toHaveLength(3);
    expect(sorted[0]?.bounds.x).toBe(0);
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const current = sorted[index];
      const next = sorted[index + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      expect((current?.bounds.x ?? 0) + (current?.bounds.width ?? 0)).toBe(
        next?.bounds.x
      );
    }
    const last = sorted.at(-1);
    expect((last?.bounds.x ?? 0) + (last?.bounds.width ?? 0)).toBe(
      RICH_MENU_WIDTH
    );
    expect(sorted.every((area) => area.bounds.height === RICH_MENU_HEIGHT)).toBe(
      true
    );
  });

  it("exposes the three primary one-tap operations", () => {
    const serialized = JSON.stringify(createRichMenuDefinition("test"));
    expect(serialized).toContain("action=fortune");
    expect(serialized).toContain("action=settings");
    expect(serialized).toContain("action=help");
  });
});
