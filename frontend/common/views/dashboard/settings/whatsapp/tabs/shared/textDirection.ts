/** Matches strings with no strong directional letters (digits, "+", separators) — e.g. phone numbers and WhatsApp IDs. */
const DIRECTION_NEUTRAL_TEXT = /^[+\d][\d\s()\-.]*$/;

/**
 * Picks the `dir` attribute for user-provided text. Digit-only strings (phone
 * numbers, WhatsApp IDs) pin to LTR — `dir="auto"` alone inherits the RTL
 * paragraph direction because they contain no strong characters — while text
 * with letters keeps auto-detection. Pair with `unicode-bidi: isolate`.
 */
export function textDirection(text: string): "ltr" | "auto" {
  return DIRECTION_NEUTRAL_TEXT.test(text) ? "ltr" : "auto";
}
