import { describe, expect, it } from "vitest";
import menu from "../config/rich-menu.json";

describe("LINE rich menu configuration", () => {
  it("uses the supported large rich menu canvas", () => {
    expect(menu.size).toEqual({ width: 2500, height: 843 });
    expect(menu.chatBarText.length).toBeGreaterThan(0);
    expect(menu.chatBarText.length).toBeLessThanOrEqual(14);
    expect(menu.namePrefix).toMatch(/^hikiyomi-/);
  });

  it("covers the canvas exactly once with three adjacent areas", () => {
    const sorted = [...menu.areas].sort((a, b) => a.bounds.x - b.bounds.x);

    expect(sorted).toHaveLength(3);
    let cursor = 0;
    for (const area of sorted) {
      expect(area.bounds.x).toBe(cursor);
      expect(area.bounds.y).toBe(0);
      expect(area.bounds.height).toBe(menu.size.height);
      expect(area.bounds.width).toBeGreaterThan(0);
      cursor += area.bounds.width;
    }
    expect(cursor).toBe(menu.size.width);
  });

  it("exposes the three primary one-tap operations", () => {
    const data = menu.areas.map((area) => area.action.data);
    expect(data).toEqual([
      "action=fortune",
      "action=settings",
      "action=help"
    ]);
  });
});
