import { seekUnusedNumericId } from "./utils";

describe("utils", () => {
  it("seekUnusedNumericId", () => {
    const map = new Map<number, string>();
    map.set(1, "Hello");
    expect(seekUnusedNumericId(map)).toBe(0);
    map.set(0, "Hello");
    expect(seekUnusedNumericId(map)).toBe(2);
    map.delete(0);
    expect(seekUnusedNumericId(map)).toBe(0);
  });
});
