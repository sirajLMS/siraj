import { describe, expect, it } from "bun:test";
import { contrastRatio, pickOnPrimary, wcagGrade } from "@/shared/lib/color-contrast.utils";

describe("shared/lib/color-contrast.utils", () => {
  describe("contrastRatio", () => {
    it("returns 21:1 contrast ratio between pure white and pure black", () => {
      expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 2);
      expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
    });

    it("returns 1:1 contrast ratio for identical colors", () => {
      expect(contrastRatio("#1976d2", "#1976d2")).toBeCloseTo(1, 2);
    });

    it("computes accurate ratio for standard MUI primary blue and white", () => {
      const ratio = contrastRatio("#1976d2", "#ffffff");
      expect(ratio).toBeGreaterThan(4.5);
    });

    it("handles invalid hex input by falling back to black luminance", () => {
      expect(contrastRatio("invalid", "#ffffff")).toBeCloseTo(21, 2);
    });
  });

  describe("wcagGrade", () => {
    it("returns AAA for ratios >= 7", () => {
      expect(wcagGrade(21)).toBe("AAA");
      expect(wcagGrade(7.0)).toBe("AAA");
    });

    it("returns AA for ratios >= 4.5 and < 7", () => {
      expect(wcagGrade(4.5)).toBe("AA");
      expect(wcagGrade(6.9)).toBe("AA");
    });

    it("returns AA Large for ratios >= 3.0 and < 4.5", () => {
      expect(wcagGrade(3.0)).toBe("AA Large");
      expect(wcagGrade(4.4)).toBe("AA Large");
    });

    it("returns Fail for ratios < 3.0", () => {
      expect(wcagGrade(2.9)).toBe("Fail");
      expect(wcagGrade(1.0)).toBe("Fail");
    });
  });

  describe("pickOnPrimary", () => {
    it("picks white text for dark primary colors", () => {
      expect(pickOnPrimary("#1976d2")).toBe("#ffffff");
      expect(pickOnPrimary("#000000")).toBe("#ffffff");
    });

    it("picks black text for light primary colors", () => {
      expect(pickOnPrimary("#ffd600")).toBe("#000000");
      expect(pickOnPrimary("#ffffff")).toBe("#000000");
    });

    it("prefers white at the white/black crossover boundary", () => {
      expect(pickOnPrimary("#757575")).toBe("#ffffff");
      expect(pickOnPrimary("#767676")).toBe("#000000");
    });

    it("handles invalid hex by falling back to black luminance (returning white text)", () => {
      expect(pickOnPrimary("invalid")).toBe("#ffffff");
    });
  });
});
