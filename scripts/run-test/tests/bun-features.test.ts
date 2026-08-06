import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from "bun:test";

describe("Bun test features", () => {
  describe("test(), it(), describe()", () => {
    test("test() works", () => {
      expect(Math.min(1, 2)).toBe(1);
    });

    it("it() works as alias", () => {
      expect(Math.min(1, 2)).toBe(1);
    });

    describe("describe() groups tests", () => {
      test("nested test", () => {
        expect(() => 1 + 1).not.toThrow();
      });
    });
  });

  describe("test modifiers", () => {
    test.skipIf(true)("test.skipIf(true) effectively skips the test", () => {
      const result = Math.max(1, 2);
      const wrong = result - 2;
      expect(result).toBe(wrong);
    });

    test.todo("test.todo() is marked as todo", () => {
      const result = Math.max(1, 2);
      const wrong = result - 2;
      expect(result).toBe(wrong);
    });

    const alwaysTrue = true;
    test.if(alwaysTrue)("test.if() runs when condition is true", () => {
      expect(() => 1 + 1).not.toThrow();
    });

    const isWindows = process.platform === "win32";
    test.skipIf(isWindows)("test.skipIf() skips when condition is true (runs on non-Windows)", () => {
      expect(() => 1 + 1).not.toThrow();
    });

    describe.if(alwaysTrue)("describe.if() runs when condition is true", () => {
      test("inner test runs", () => {
        expect(() => 1 + 1).not.toThrow();
      });
    });

    test.each([
      [1, 2, 3],
      [3, 4, 7],
    ])("test.each(%p + %p = %p)", (a, b, expected) => {
      expect(a + b).toBe(expected);
    });

    test.each([
      { input: "hello", len: 5 },
      { input: "world", len: 5 },
    ])("test.each with objects: $input has length $len", ({ input, len }) => {
      expect(input).toHaveLength(len);
    });
  });

  describe("test serial and concurrent", () => {
    test.serial("test.serial() runs sequentially", () => {
      expect(() => 1 + 1).not.toThrow();
    });

    test.concurrent("test.concurrent() runs in parallel", async () => {
      await Promise.resolve();
      expect(() => 1 + 1).not.toThrow();
    });

    test.failing("test.failing() passes when test fails", () => {
      expect(0.1 + 0.2).toBeCloseTo(0.3, 10);
    });
  });

  describe("retry and timeout", () => {
    test(
      "retry option allows eventual success",
      () => {
        expect(() => 1 + 1).not.toThrow();
      },
      { retry: 2 }
    );

    test("timeout as third argument", () => {
      expect(() => 1 + 1).not.toThrow();
    }, 10000);
  });

  describe("basic matchers", () => {
    test("toBe()", () => {
      const result = Math.min(1, 2);
      const expected = Math.max(0, 1);
      expect(result).toBe(expected);
    });

    test("toBeNull()", () => {
      const value = ["a", "b"].find(s => s === "z") ?? null;
      expect(value).toBeNull();
    });

    test("toBeUndefined()", () => {
      const obj = { a: 1 } as Record<string, number>;
      const value = obj.b;
      expect(value).toBeUndefined();
    });

    test("toBeDefined()", () => {
      const obj = { x: "defined" };
      const value = obj.x;
      expect(value).toBeDefined();
    });

    test("toBeTruthy()", () => {
      const value = [1, 2, 3].filter(n => n > 2);
      const str = "hello".toUpperCase();
      expect(value).toBeTruthy();
      expect(str).toBeTruthy();
    });

    test("toBeFalsy()", () => {
      const value = [1, 2, 3].filter(n => n > 5);
      const str = "".trim();
      const nil = ["a"].find(s => s === "z") ?? null;
      expect(value).toBeFalsy();
      expect(str).toBeFalsy();
      expect(nil).toBeFalsy();
    });

    test("toBeGreaterThan(), toBeLessThan()", () => {
      expect(5).toBeGreaterThan(3);
      expect(3).toBeLessThan(5);
    });

    test("toBeGreaterThanOrEqual(), toBeLessThanOrEqual()", () => {
      expect(5).toBeGreaterThanOrEqual(5);
      expect(5).toBeGreaterThanOrEqual(4);
      expect(3).toBeLessThanOrEqual(3);
      expect(3).toBeLessThanOrEqual(4);
    });

    test("toEqual()", () => {
      expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
    });

    test("not.toBe(), not.toEqual()", () => {
      const result = Math.min(1, 2);
      const other = Math.max(2, 3);
      expect(result).not.toBe(other);
      expect({ a: 1 }).not.toEqual({ a: 2 });
    });

    test("toContain()", () => {
      expect([1, 2, 3]).toContain(2);
      expect("hello world").toContain("world");
    });

    test("toHaveProperty()", () => {
      expect({ name: "test", age: 25 }).toHaveProperty("name");
      expect({ name: "test", age: 25 }).toHaveProperty("age", 25);
    });

    test("toThrow()", () => {
      expect(() => {
        throw new Error("boom");
      }).toThrow();
    });

    test("not.toThrow()", () => {
      expect(() => 1 + 1).not.toThrow();
    });

    test("toBeInstanceOf()", () => {
      expect(new Error("test")).toBeInstanceOf(Error);
      expect([]).toBeInstanceOf(Array);
    });

    test("toHaveLength()", () => {
      expect([1, 2, 3]).toHaveLength(3);
      expect("hello").toHaveLength(5);
    });

    test("toMatch()", () => {
      expect("hello world").toMatch(/hello/);
      expect("hello world").toMatch("world");
    });

    test("toThrowError()", () => {
      expect(() => {
        throw new Error("specific error message");
      }).toThrowError("specific error message");
    });

    test("toMatchSnapshot()", () => {
      expect({ name: "snapshot-test", value: 42 }).toMatchSnapshot();
    });

    test("expect().resolves", async () => {
      return expect(Promise.resolve(42)).resolves.toBe(42);
    });

    test("expect().rejects", async () => {
      return expect(Promise.reject(new Error("fail"))).rejects.toThrow("fail");
    });
  });

  describe("lifecycle hooks", () => {
    let beforeAllRan = false;
    let afterAllRan = false;
    let beforeEachCount = 0;
    let afterEachCount = 0;

    beforeAll(() => {
      beforeAllRan = true;
    });

    afterAll(() => {
      afterAllRan = true;
      expect(beforeAllRan).toBe(true);
      expect(afterAllRan).toBe(true);
    });

    beforeEach(() => {
      beforeEachCount++;
    });

    afterEach(() => {
      afterEachCount++;
    });

    test("beforeAll ran before this test", () => {
      expect(beforeAllRan).toBe(true);
    });

    test("beforeEach increments counter", () => {
      expect(beforeEachCount).toBeGreaterThanOrEqual(2);
      expect(afterEachCount).toBeGreaterThanOrEqual(1);
    });
  });
});
