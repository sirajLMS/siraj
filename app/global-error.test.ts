import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { readCookie } from "@/app/global-error.helpers";

describe("readCookie ReDoS and Parsing Safety", () => {
  let originalDocument: typeof globalThis.document;

  beforeEach(() => {
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  test("returns null when document is undefined", () => {
    // @ts-expect-error - simulating SSR / no DOM environment
    globalThis.document = undefined;
    expect(readCookie("NEXT_LOCALE")).toBeNull();
  });

  test("returns null when cookie is absent", () => {
    const window = new Window();
    globalThis.document = window.document as unknown as Document;
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "";
    expect(readCookie("non_existent")).toBeNull();
  });

  test("correctly parses single and multiple cookies", () => {
    const window = new Window();
    globalThis.document = window.document as unknown as Document;

    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "NEXT_LOCALE=ar";
    expect(readCookie("NEXT_LOCALE")).toBe("ar");

    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "theme=dark";
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "NEXT_LOCALE=en";
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "other=123";

    expect(readCookie("NEXT_LOCALE")).toBe("en");
    expect(readCookie("theme")).toBe("dark");
    expect(readCookie("other")).toBe("123");
  });

  test("URL decodes cookie values", () => {
    const window = new Window();
    globalThis.document = window.document as unknown as Document;

    const arabicText = "مرحباً";
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = `custom_data=${encodeURIComponent(arabicText)}`;
    expect(readCookie("custom_data")).toBe(arabicText);
  });

  test("handles values containing equals signs", () => {
    const window = new Window();
    globalThis.document = window.document as unknown as Document;

    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "session=abc=def=123";
    expect(readCookie("session")).toBe("abc=def=123");
  });

  test("does not falsely match partial cookie name prefixes or suffixes", () => {
    const window = new Window();
    globalThis.document = window.document as unknown as Document;

    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "my_NEXT_LOCALE=ar";
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = "NEXT_LOCALE_extra=en";
    expect(readCookie("NEXT_LOCALE")).toBeNull();
  });

  test("safely handles special regex characters in cookie name without throwing or ReDoS", () => {
    const window = new Window();
    globalThis.document = window.document as unknown as Document;

    const specialCharsName = "^$()*+?[\\]{}|\\";
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = `${encodeURIComponent(specialCharsName)}=value123`;

    // Should not throw SyntaxError or stall on regex execution
    expect(readCookie(specialCharsName)).toBeNull(); // name in document.cookie is URL-encoded
    // biome-ignore lint/suspicious/noDocumentCookie: test setup
    document.cookie = `${specialCharsName}=value123`;
    expect(readCookie(specialCharsName)).toBe("value123");
  });
});
