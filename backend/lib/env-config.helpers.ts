/**
 * Mask a secret value, exposing only the last 4 characters.
 *
 * - Returns `undefined` for `undefined`/empty input.
 * - For values with length ≤ 4: returns `"••••"`.
 * - For longer values: returns 8 bullets followed by the last 4 chars.
 *
 * Pure, side-effect free.
 */
export function maskSecretValue(value: string | undefined): string | undefined {
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  if (value.length <= 4) {
    return "••••";
  }
  return `••••••••${value.slice(-4)}`;
}
