import { describe, expect, test } from "bun:test";
import { buildSocialLink } from "@/shared/lib/social/social-links";

describe("buildSocialLink", () => {
  describe("whatsapp", () => {
    test("+966501234567 produces wa.me link and keeps original display text", () => {
      const result = buildSocialLink("whatsapp", "+966501234567");
      expect(result).toEqual({
        href: "https://wa.me/966501234567",
        displayText: "+966501234567",
      });
    });

    test("966501234567 without leading + produces wa.me link", () => {
      const result = buildSocialLink("whatsapp", "966501234567");
      expect(result).toEqual({
        href: "https://wa.me/966501234567",
        displayText: "966501234567",
      });
    });

    test("null returns null", () => {
      expect(buildSocialLink("whatsapp", null)).toBeNull();
    });

    test("whitespace-only returns null", () => {
      expect(buildSocialLink("whatsapp", "   ")).toBeNull();
    });
  });

  describe("facebook", () => {
    test("url without protocol gets https:// prepended", () => {
      const result = buildSocialLink("facebook", "facebook.com/foo");
      expect(result).toEqual({
        href: "https://facebook.com/foo",
        displayText: "facebook.com/foo",
      });
    });

    test("url with https:// protocol is kept as-is", () => {
      const result = buildSocialLink("facebook", "https://facebook.com/foo");
      expect(result).toEqual({
        href: "https://facebook.com/foo",
        displayText: "https://facebook.com/foo",
      });
    });

    test("url with http protocol is kept as-is", () => {
      const httpUrl = `http://facebook.com/foo`;
      const result = buildSocialLink("facebook", httpUrl);
      expect(result).toEqual({
        href: httpUrl,
        displayText: httpUrl,
      });
    });

    test("invalid or unsafe url returns null", () => {
      expect(buildSocialLink("facebook", "javascript:alert(1)")).toBeNull();
      expect(buildSocialLink("facebook", "https://\x00facebook.com/foo")).toBeNull();
    });

    test("empty string returns null", () => {
      expect(buildSocialLink("facebook", "")).toBeNull();
    });
  });

  describe("twitter", () => {
    test("@handle strips leading @ and builds twitter.com url", () => {
      const result = buildSocialLink("twitter", "@handle");
      expect(result).toEqual({
        href: "https://twitter.com/handle",
        displayText: "handle",
      });
    });

    test("twitter.com/handle strips prefix and builds url", () => {
      const result = buildSocialLink("twitter", "twitter.com/handle");
      expect(result).toEqual({
        href: "https://twitter.com/handle",
        displayText: "handle",
      });
    });

    test("undefined returns null", () => {
      expect(buildSocialLink("twitter", undefined)).toBeNull();
    });
  });

  describe("zoom", () => {
    test("valid https zoom url passes through", () => {
      const result = buildSocialLink("zoom", "https://zoom.us/j/123");
      expect(result).toEqual({
        href: "https://zoom.us/j/123",
        displayText: "https://zoom.us/j/123",
      });
    });

    test("javascript protocol returns null (unsafe)", () => {
      expect(buildSocialLink("zoom", "javascript:alert(1)")).toBeNull();
    });

    test("null returns null", () => {
      expect(buildSocialLink("zoom", null)).toBeNull();
    });
  });
});
