import { describe, expect, it } from "bun:test";
import { mergeSx } from "./mergeSx";

describe("mergeSx", () => {
  it("filters out null and undefined style arguments", () => {
    const style1 = { color: "red" };
    const style2 = { margin: 2 };
    const result = mergeSx(undefined, style1, null, style2, undefined);

    expect(result).toEqual([style1, style2]);
  });

  it("handles boolean and function sx items correctly", () => {
    const themeFn = () => ({ background: "blue" });
    const result = mergeSx(false, themeFn, true);

    expect(result).toEqual([false, themeFn, true]);
  });

  it("flattens nested sx array arguments", () => {
    const style1 = { color: "red" };
    const style2 = { padding: 1 };
    const style3 = { margin: 0 };
    const result = mergeSx([style1, [style2, undefined]], null, style3);

    expect(result).toEqual([style1, style2, style3]);
  });

  it("returns an empty array when called with no arguments or only undefined/null", () => {
    expect(mergeSx()).toEqual([]);
    expect(mergeSx(undefined, null)).toEqual([]);
  });
});
