import { ARROW_REGEX, EXPORT_CONST_REGEX, KEY_REGEX } from "@/scripts/translate-locale-ar.constants";
import type { EntryKind, LocaleEntry } from "@/scripts/translate-locale-ar.types";

// ─── Object-literal scanner ─────────────────────────────────────────────────

/** Skip a string literal starting at a quote char; returns index after it. */
export function skipQuoted(src: string, i: number): number {
  const quote = src[i];
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === "\\") {
      j += 2;
      continue;
    }
    if (src[j] === quote) return j + 1;
    j++;
  }
  return j;
}

export function isLineCommentAt(src: string, i: number): boolean {
  return src.startsWith("//", i);
}

export function skipLineComment(src: string, i: number): number {
  const nl = src.indexOf("\n", i);
  return nl < 0 ? src.length : nl;
}

export function isBlockCommentAt(src: string, i: number): boolean {
  return src.startsWith("/*", i);
}

export function skipBlockComment(src: string, i: number): number {
  const end = src.indexOf("*/", i + 2);
  return end < 0 ? src.length : end + 2;
}

/** Skip a `${...}` interpolation expression. `i` points just after `${`;
 *  returns the index after the matching `}`. Handles nested braces, strings,
 *  templates, and comments inside the expression. */
export function skipInterpolation(src: string, i: number): number {
  let depth = 1;
  let j = i;
  while (j < src.length && depth > 0) {
    const skipped = skipSpecial(src, j);
    if (skipped > j) {
      j = skipped;
      continue;
    }
    if (src[j] === "{") depth++;
    if (src[j] === "}") depth--;
    j++;
  }
  return j;
}

/** Skip a template literal starting at a backtick; returns index after it. */
function skipTemplate(src: string, i: number): number {
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === "\\") {
      j += 2;
      continue;
    }
    if (c === "`") return j + 1;
    if (c === "$" && src[j + 1] === "{") {
      j = skipInterpolation(src, j + 2);
      continue;
    }
    j++;
  }
  return j;
}

/** If `src[i]` starts a string/template/comment, return the index after it.
 *  Otherwise return `i` unchanged (caller advances by one). */
export function skipSpecial(src: string, i: number): number {
  const c = src[i];
  if (c === '"' || c === "'") return skipQuoted(src, i);
  if (c === "`") return skipTemplate(src, i);
  if (isLineCommentAt(src, i)) return skipLineComment(src, i);
  if (isBlockCommentAt(src, i)) return skipBlockComment(src, i);
  return i;
}

export interface Depth {
  paren: number;
  bracket: number;
  brace: number;
}

export function zeroDepth(): Depth {
  return { paren: 0, bracket: 0, brace: 0 };
}

export function depthZero(d: Depth): boolean {
  return d.paren === 0 && d.bracket === 0 && d.brace === 0;
}

/** Apply one bracket-like char to the depth counters. */
export function applyBracket(c: string, d: Depth): void {
  if (c === "(") d.paren++;
  else if (c === ")") d.paren--;
  else if (c === "[") d.bracket++;
  else if (c === "]") d.bracket--;
  else if (c === "{") d.brace++;
  else if (c === "}") d.brace--;
}

/** Scan a value starting at `i`; returns the index of the terminating
 *  top-level `,` or `}` (the char itself, not consumed). */
function scanValueEnd(src: string, i: number): number {
  const d = zeroDepth();
  let j = i;
  while (j < src.length) {
    const skipped = skipSpecial(src, j);
    if (skipped > j) {
      j = skipped;
      continue;
    }
    const c = src[j];
    if (depthZero(d) && (c === "," || c === "}")) return j;
    applyBracket(c, d);
    j++;
  }
  return j;
}

/** Find the `{` that opens the exported const's object literal. Locale leaf
 *  types are named interfaces, never inline object-literal types, so the
 *  first `{` after the export header is the object literal. */
function findRootObject(src: string): number {
  const m = EXPORT_CONST_REGEX.exec(src);
  if (!m) return -1;
  return src.indexOf("{", m.index + m[0].length);
}

function normalizeKey(raw: string): string {
  if (raw.startsWith('"') || raw.startsWith("'")) return raw.slice(1, -1);
  return raw;
}

/** Classify a parsed value slice: a quoted/backtick literal is a string,
 *  an arrow function is a translatable function, and anything else
 *  (identifier, member expression, shorthand reference from an aggregator or
 *  shared block) is a "reference" — never translated, never sent to the
 *  model, and excluded from reports. */
function classifyValue(value: string): EntryKind {
  const first = value[0] ?? "";
  if (first === '"' || first === "'" || first === "`") return "string";
  if (ARROW_REGEX.test(value.slice(0, 200))) return "function";
  return "reference";
}

/** Entries the model can translate (excludes code references). */
export function translatable(entries: LocaleEntry[]): LocaleEntry[] {
  return entries.filter(e => e.kind !== "reference");
}

/** Skip whitespace, commas, and comments between object entries. */
function skipTrivia(src: string, i: number): number {
  let j = i;
  for (;;) {
    if (j >= src.length) return j;
    const c = src[j];
    if (/\s|,/.test(c)) {
      j++;
      continue;
    }
    if (isLineCommentAt(src, j)) {
      j = skipLineComment(src, j);
      continue;
    }
    if (isBlockCommentAt(src, j)) {
      j = skipBlockComment(src, j);
      continue;
    }
    return j;
  }
}

/** Skip the `?:`/optional marker, the `:`, and surrounding whitespace after
 *  a key. Returns the index of the value's first char. */
function skipKeySuffix(src: string, i: number): number {
  let j = i;
  while (j < src.length && /[\s?]/.test(src[j])) j++;
  if (src[j] === ":") j++;
  while (j < src.length && /\s/.test(src[j])) j++;
  return j;
}

/** Recursively collect entries from an object literal starting at its `{`. */
function collectEntries(src: string, openIdx: number, prefix: string, out: LocaleEntry[]): number {
  let i = openIdx + 1;
  while (i < src.length) {
    i = skipTrivia(src, i);
    if (i >= src.length) return i;
    if (src[i] === "}") return i + 1;

    const keyMatch = KEY_REGEX.exec(src.slice(i));
    if (!keyMatch) {
      // Not a key — likely a spread (`...x`). Skip the whole value safely.
      i = scanValueEnd(src, i);
      continue;
    }
    i = skipKeySuffix(src, i + keyMatch[0].length);

    const key = prefix ? `${prefix}.${normalizeKey(keyMatch[0])}` : normalizeKey(keyMatch[0]);
    if (src[i] === "{") {
      i = collectEntries(src, i, key, out);
      continue;
    }
    const end = scanValueEnd(src, i);
    const value = src.slice(i, end).trim();
    out.push({ key, kind: classifyValue(value), source: value });
    i = end;
  }
  return i;
}

/** Parse a locale leaf file into flattened entries. Aggregator files (only
 *  re-exports / references) naturally produce zero entries. */
export function parseLocaleFile(src: string): LocaleEntry[] {
  const openIdx = findRootObject(src);
  if (openIdx < 0) return [];
  const out: LocaleEntry[] = [];
  collectEntries(src, openIdx, "", out);
  return out;
}

/** Decode a decoded display value from a parsed source slice. */
export function decodeValue(entry: LocaleEntry): string {
  if (entry.kind === "function") return entry.source;
  const s = entry.source;
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith("`") && s.endsWith("`"))
  ) {
    const inner = s.slice(1, -1);
    return inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\(.)/g, "$1");
  }
  return s;
}
