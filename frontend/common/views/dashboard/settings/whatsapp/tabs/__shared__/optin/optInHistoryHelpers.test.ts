import { describe, expect, it } from "bun:test";
import {
  formatDateInput,
  parseDateInput,
  toCsvValue,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/optin/optInHistoryHelpers";

describe("optInHistoryHelpers", () => {
  describe("toCsvValue", () => {
    it("neutralizes CSV formula injection prefixes (=, +, -, @, \\t, \\r)", () => {
      expect(toCsvValue("=1+1")).toBe("'=1+1");
      expect(toCsvValue("+15551234")).toBe("'+15551234");
      expect(toCsvValue("-cmd")).toBe("'-cmd");
      expect(toCsvValue("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
      expect(toCsvValue("\tTabLeading")).toBe("'\tTabLeading");
      expect(toCsvValue("\rCRLeading")).toBe('"\'\rCRLeading"');
    });

    it("quotes cells containing commas, quotes, or newlines", () => {
      expect(toCsvValue("hello, world")).toBe('"hello, world"');
      expect(toCsvValue('say "hello"')).toBe('"say ""hello"""');
      expect(toCsvValue("line1\nline2")).toBe('"line1\nline2"');
    });

    it("leaves standard plain strings untouched", () => {
      expect(toCsvValue("John Doe")).toBe("John Doe");
      expect(toCsvValue("2025-01-01")).toBe("2025-01-01");
    });
  });

  describe("parseDateInput and formatDateInput", () => {
    it("parses valid date string", () => {
      const parsed = parseDateInput("2025-01-15");
      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(2025);
    });

    it("returns null for invalid or empty date input", () => {
      expect(parseDateInput("")).toBeNull();
      expect(parseDateInput(null)).toBeNull();
      expect(parseDateInput("invalid-date")).toBeNull();
    });

    it("formats Date to ISO YYYY-MM-DD", () => {
      const date = new Date("2025-06-20T12:00:00Z");
      expect(formatDateInput(date)).toBe("2025-06-20");
      expect(formatDateInput(null)).toBe("");
    });
  });
});
