/**
 * WCAG 2.1 color contrast utilities — pure functions shared across frontend and backend.
 *
 * Implements the relative luminance and contrast-ratio algorithms from
 * [WCAG 2.1 §1.4.3](https://www.w3.org/TR/WCAG21/#contrast-minimum)
 * (minimum contrast) and [§1.4.6](https://www.w3.org/TR/WCAG21/#contrast-enhanced)
 * (enhanced contrast).
 *
 * Layer-isolation-safe: lives in `shared/lib/` so both `frontend/` (the
 * `useAppearanceCssVars` hook and the `WcagBadge` UI) and `backend/` (future
 * server-side pre-validation of brand colors) can import the same canonical
 * implementation without duplicating the formula.
 *
 * Used by (Task 9.6 — AC-32):
 *  - `frontend/common/hooks/useAppearanceCssVars.ts` — derives
 *    `--mui-palette-onPrimary` dynamically from the published `primaryMain`
 *    so foreground text on brand-colored buttons stays readable.
 *  - `frontend/common/views/dashboard/components/customize/WcagBadge.tsx` —
 *    renders "AAA" / "AA" / "AA Large" / "Fail" next to the admin's chosen
 *    color in the customizer sidebar.
 */

/**
 * Strict 6-digit hex pattern (`#RRGGBB`). Matches the Zod schema in
 * `shared/schemas/appearance.zod.ts` (decision §22) and the
 * `ColorEditorSection.HEX_PATTERN` guard so the same input shape flows
 * through validation, persistence, and contrast math.
 */
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Parsed sRGB channel tuple (0-255 per channel).
 */
interface RgbChannels {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Parse a `#RRGGBB` hex string into an {@link RgbChannels} tuple (0-255 each).
 *
 * Returns `{ r: 0, g: 0, b: 0 }` for invalid input so callers don't need to
 * branch on parse failure — the resulting luminance is `0` (black), which
 * produces a deterministic worst-case contrast ratio of `21:1` against white
 * (a visible signal that the input was malformed, not a silent NaN).
 */
function parseHex(hex: string): RgbChannels {
  if (!HEX_PATTERN.test(hex)) {
    return { r: 0, g: 0, b: 0 };
  }
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/**
 * Convert an sRGB channel value (0-255) to its linear-light component per
 * the WCAG 2.1 formula.
 *
 * - Values ≤ 0.03928 (i.e. ≤ ~10/255) use the linear segment: `c / 12.92`.
 * - Values above use the gamma-decoded segment: `((c + 0.055) / 1.055) ^ 2.4`.
 *
 * Reference: [W3C relative luminance definition](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance).
 */
function linearizeChannel(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

/**
 * Compute the WCAG 2.1 relative luminance of a `#RRGGBB` color.
 *
 * Returns a value in `[0, 1]` where:
 *  - `0` = pure black (`#000000`)
 *  - `1` = pure white (`#ffffff`)
 *
 * Invalid hex inputs return `0` (treated as black — see {@link parseHex}).
 *
 * @example
 * relativeLuminance("#ffffff") // → 1
 * relativeLuminance("#000000") // → 0
 * relativeLuminance("#1976d2") // → ~0.18 (MUI default primary)
 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

/**
 * Compute the WCAG 2.1 contrast ratio between two `#RRGGBB` colors.
 *
 * Returns a value in `[1, 21]` where:
 *  - `1` = identical colors (no contrast)
 *  - `21` = pure black against pure white (maximum contrast)
 *
 * The order of `foreground` / `background` does not matter — the formula
 * uses `(L1 + 0.05) / (L2 + 0.05)` with `L1 ≥ L2`.
 *
 * @example
 * contrastRatio("#ffffff", "#000000") // → 21
 * contrastRatio("#767676", "#ffffff") // → ~4.54 (AA boundary for normal text)
 */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.1 compliance grade for a contrast ratio.
 *
 * Thresholds (per [WCAG 2.1 §1.4.3](https://www.w3.org/TR/WCAG21/#contrast-minimum)
 * and [§1.4.6](https://www.w3.org/TR/WCAG21/#contrast-enhanced)):
 *  - `"AAA"` — ratio ≥ 7.0 (enhanced contrast, normal text)
 *  - `"AA"` — ratio ≥ 4.5 (minimum contrast, normal text)
 *  - `"AA Large"` — ratio ≥ 3.0 (large text ≥ 18pt / 14pt bold, or UI components)
 *  - `"Fail"` — ratio < 3.0 (does not meet any WCAG threshold)
 *
 * @example
 * wcagGrade(21) // → "AAA"
 * wcagGrade(4.5) // → "AA"
 * wcagGrade(3.0) // → "AA Large"
 * wcagGrade(2.5) // → "Fail"
 */
export function wcagGrade(ratio: number): "AAA" | "AA" | "AA Large" | "Fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

/**
 * Pick the foreground color (black or white) with higher contrast against
 * a given `primaryMain` brand color, for use as `--mui-palette-onPrimary`.
 *
 * AC-32 requires the system to "dynamically derive `--mui-palette-onPrimary`
 * (`#000000` or `#FFFFFF`) to guarantee readable text". This computes the
 * contrast ratio of `primaryMain` against pure white and pure black, then
 * returns whichever produces the higher ratio.
 *
 * Ties (when both ratios are equal — e.g. mid-gray primaries with luminance
 * ≈ 0.5) prefer white, matching the MUI default `palette.primary.contrastText`
 * convention and keeping small-button text legible on most brand colors.
 *
 * @example
 * pickOnPrimary("#1976d2") // → "#ffffff" (dark blue → white text)
 * pickOnPrimary("#ffd600") // → "#000000" (yellow → black text)
 * pickOnPrimary("#767676") // → "#ffffff" (tie → default white)
 */
export function pickOnPrimary(primaryMain: string): "#ffffff" | "#000000" {
  const againstWhite = contrastRatio(primaryMain, "#ffffff");
  const againstBlack = contrastRatio(primaryMain, "#000000");
  return againstBlack > againstWhite ? "#000000" : "#ffffff";
}
