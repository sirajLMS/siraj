// ======================================================
// INTENTIONAL FAILURES — DO NOT FIX
// This file contains deliberate test failures to verify
// that the run-test script's --last parser correctly
// captures and displays error details.
// ======================================================

import { describe, expect, test } from "bun:test";

describe("intentional failures", () => {
  test("intentional assertion error: wrong value", () => {
    expect(1 + 1).toBe(3);
  });

  test("intentional thrown error: explicit throw", () => {
    throw new Error("This error is intentional for parser verification");
  });

  test("intentional deep equality mismatch", () => {
    expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 999 });
  });
});

describe("passing tests for contrast", () => {
  test("passing: simple addition", () => {
    expect(2 + 2).toBe(4);
  });

  test("passing: string containment", () => {
    expect("hello world").toContain("world");
  });

  test("passing: array length", () => {
    expect([1, 2, 3]).toHaveLength(3);
  });

  test("passing: object property", () => {
    expect({ name: "test" }).toHaveProperty("name", "test");
  });

  test("passing: negated assertion", () => {
    expect(1).not.toBe(2);
  });
});
