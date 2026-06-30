import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from "bun:test";

describe("Bun test features", () => {
  describe("test(), it(), describe()", () => {
    test("test() works", () => {
      expect(1 + 1).toBe(2);
    });

    it("it() works as alias", () => {
      expect(1 + 1).toBe(2);
    });

    describe("describe() groups tests", () => {
      test("nested test", () => {
        expect(true).toBe(true);
      });
    });
  });

  describe("test modifiers", () => {
    test.skipIf(true)("test.skipIf(true) effectively skips the test", () => {
      expect(false).toBe(true);
    });

    test.todo("test.todo() is marked as todo", () => {
      expect(false).toBe(true);
    });

    const alwaysTrue = true;
    test.if(alwaysTrue)("test.if() runs when condition is true", () => {
      expect(true).toBe(true);
    });

    const isWindows = process.platform === "win32";
    test.skipIf(isWindows)("test.skipIf() skips when condition is true (runs on non-Windows)", () => {
      expect(true).toBe(true);
    });

    describe.if(alwaysTrue)("describe.if() runs when condition is true", () => {
      test("inner test runs", () => {
        expect(true).toBe(true);
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
      expect(true).toBe(true);
    });

    test.concurrent("test.concurrent() runs in parallel", async () => {
      await Promise.resolve();
      expect(true).toBe(true);
    });

    test.failing("test.failing() passes when test fails", () => {
      expect(0.1 + 0.2).toBe(0.3);
    });
  });

  describe("retry and timeout", () => {
    test(
      "retry option allows eventual success",
      () => {
        expect(true).toBe(true);
      },
      { retry: 2 }
    );

    test("timeout as third argument", () => {
      expect(true).toBe(true);
    }, 10000);
  });

  describe("basic matchers", () => {
    test("toBe()", () => {
      expect(1 + 1).toBe(2);
    });

    test("toBeNull()", () => {
      expect(null).toBeNull();
    });

    test("toBeUndefined()", () => {
      expect(undefined).toBeUndefined();
    });

    test("toBeDefined()", () => {
      expect("defined").toBeDefined();
    });

    test("toBeTruthy()", () => {
      expect(1).toBeTruthy();
      expect("non-empty").toBeTruthy();
    });

    test("toBeFalsy()", () => {
      expect(0).toBeFalsy();
      expect("").toBeFalsy();
      expect(null).toBeFalsy();
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
      expect(1).not.toBe(2);
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
      await expect(Promise.resolve(42)).resolves.toBe(42);
    });

    test("expect().rejects", async () => {
      await expect(Promise.reject(new Error("fail"))).rejects.toThrow("fail");
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
