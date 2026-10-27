/** Spreadsheet formula starters — cells beginning with one of these are neutralized (OWASP CSV-injection guidance: =, +, -, @, tab, CR). */
const CSV_FORMULA_PREFIXES: readonly string[] = ["=", "+", "-", "@", "\t", "\r"];

/** RFC 4180 line separator used by every CSV serializer. */
export const CSV_LINE_SEPARATOR = "\r\n";

/** RFC 4180 escaping plus formula neutralization: cells starting with `=`, `+`, `-`, `@`, a tab or a CR (including after leading whitespace) get a `'` prefix. */
export function toCsvCell(value: string): string {
  const trimmed = value.replace(/^ +/, "");
  const startsFormula = trimmed.length > 0 && CSV_FORMULA_PREFIXES.some(prefix => trimmed.startsWith(prefix));
  const hardened = startsFormula ? `'${value}` : value;
  if (hardened.includes(",") || hardened.includes('"') || hardened.includes("\n") || hardened.includes("\r")) {
    return `"${hardened.replaceAll('"', '""')}"`;
  }
  return hardened;
}
