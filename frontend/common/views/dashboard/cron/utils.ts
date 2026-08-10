/**
 * Safely narrows an unknown value to a known enum/string-literal type.
 *
 * Returns `null` when `value` is not a string or is not present in
 * `validValues`. Unlike a raw `as` cast, the narrowing is checked at
 * runtime, so unexpected data (e.g. from GraphQL/DateGrid cells) cannot
 * silently assume an invalid enum member.
 */
export function safeEnum<T extends string>(value: unknown, validValues: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  return validValues.find(v => v === value) ?? null;
}

/**
 * Narrows an unknown value to `string` with a runtime check. Returns the raw
 * string when `value` is already a string, otherwise falls back to
 * `String(value ?? "")`. Useful for DataGrid value formatters that previously
 * used an unchecked `value as string` cast.
 */
export function safeString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "symbol") {
    return value.description ?? "";
  }
  if (value == null) {
    return "";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
