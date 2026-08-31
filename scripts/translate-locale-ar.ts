/**
 * TRANSLATE-LOCALE-AR — AI-assisted Arabic locale review report generator
 * for the arabic-locale-review skill (.agents/skills/arabic-locale-review).
 *
 * Walks the `shared/locale/ar/**` leaf modules, pairs each entry (plain strings
 * AND interpolation/pluralization arrow functions) with its English counterpart,
 * sends them to a general instruct model (default `nvidia/moonshotai/kimi-k3`)
 * through an OpenAI-compatible endpoint, validates the model output, and writes
 * a per-file review report as JSON.
 *
 * THE SCRIPT NEVER MODIFIES LOCALE FILES. It is strictly read-only for anything
 * under `shared/locale/`. Reports are written to `scratch/locale-ar/<run-id>/`.
 * A human/agent then reviews the report and applies accepted changes with the
 * Edit tool.
 *
 * ## Why not riva-translate-4b-instruct-v2
 *
 * Tested 2026-08-30: it is a neural machine translation model whose chat
 * template reserves the system slot for the language-pair tag (`en-ar`) and
 * accepts no instructions, glossary, or domain context. On WMT24++ it scores
 * worst on Arabic (En→Ar, 9.7 sacreBLEU / COMET 0.23). A general instruct
 * model with a terminology glossary produced clearly better UI Arabic in a
 * 40-key A/B test. See .agents/skills/arabic-locale-review/references/model-notes.md.
 *
 * ## Usage
 *
 *   # Single file or directory (files aggregate, dirs expand to *.ts leaves)
 *   bun run scripts/translate-locale-ar.ts shared/locale/ar/auth/login.ts
 *   bun run scripts/translate-locale-ar.ts shared/locale/ar/dashboard/students
 *
 *   # Everything
 *   bun run scripts/translate-locale-ar.ts --all
 *
 *   # List leaf files without calling the model
 *   bun run scripts/translate-locale-ar.ts --all --list
 *
 *   # Resume an interrupted run (reports are per-file and persistent)
 *   bun run scripts/translate-locale-ar.ts --all --resume --out-dir scratch/locale-ar/full-run
 *
 * Code-reference values (identifiers, member expressions, shorthand shared
 * blocks — e.g. `adminActions: adminViewAr.adminActions`) are classified as
 * `reference` and never sent to the model or reported; only string literals
 * and arrow functions are translatable.
 *
 * ## Report format (per locale file, mirrors the ar/ tree)
 *
 *   <out-dir>/auth/login.json            — entries with en/current/proposed + status
 *   <out-dir>/_summary.json              — run-level counts + per-file stats
 *   <out-dir>/raw/<name>.txt             — raw model output when JSON parsing failed
 *
 * ## Entry status values
 *
 *   "unchanged" — model kept the current Arabic (no action needed)
 *   "changed"   — model proposes a new value; validated, still needs human review
 *   "invalid"   — validation failed (shape mismatch, placeholders lost, …);
 *                 the reported proposal MUST NOT be applied
 *   "error"     — API/parse failure; re-run the file
 *
 * ## Environment
 *
 *   TRANSLATE_API_KEY   (required) API key for the OpenAI-compatible endpoint
 *   TRANSLATE_BASE_URL  default http://localhost:20128/v1
 *   TRANSLATE_MODEL     default nvidia/moonshotai/kimi-k3
 *
 * Note: the omniroute gateway requires `"tool_choice": "none"` in the request
 * (it injects `tool_choice: "auto"` otherwise, which vLLM rejects).
 *
 * ## Exit codes
 *   0 — reports written (even if some entries are "invalid"/"error")
 *   1 — fatal error (bad args, missing API key, unreadable files)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { logError, logInfo, logSuccess, logWarning } from "@/scripts/health/__shared__/log";

// ─── Configuration ─────────────────────────────────────────────────────────

const LOCALE_ROOT = "shared/locale";
const EN_ROOT = `${LOCALE_ROOT}/en`;
const AR_ROOT = `${LOCALE_ROOT}/ar`;
const DEFAULT_BASE_URL = "http://localhost:20128/v1";
const DEFAULT_MODEL = "nvidia/moonshotai/kimi-k3";
const DEFAULT_OUT_PREFIX = "scratch/locale-ar";
/** Entries translated per API call. Keep small: generation time is roughly
 *  proportional to OUTPUT size, and the remote NIM throughput lets big batches
 *  (60 entries ≈ 12k+ tokens) overrun the request timeout. */
const CHUNK_SIZE = 30;
const MAX_TOKENS_FLOOR = 4096;
const MAX_TOKENS_CEILING = 12288;
const TEMPERATURE = 0.2;
const REQUEST_TIMEOUT_MS = 480_000;

/** Rough output-token cap for a chunk: translate length ≈ input length, plus
 *  JSON/key overhead. *4 chars-per-token heuristic with a 2x headroom. */
function estimateMaxTokens(entries: LocaleEntry[]): number {
  const chars = entries.reduce((sum, e) => sum + e.source.length * 2 + 32, 0);
  const est = Math.ceil(chars / 2) + 1024;
  return Math.min(MAX_TOKENS_CEILING, Math.max(MAX_TOKENS_FLOOR, est));
}

/**
 * Terminology glossary sent with every request. Keys are English source terms,
 * values are the canonical Arabic renderings used across the app.
 * Grounded in existing ar/ files (grep counts measured 2026-08-30).
 */
const GLOSSARY: ReadonlyArray<readonly [string, string]> = [
  ["Student", "طالب"],
  ["Teacher", "معلم"],
  ["Parent", "ولي أمر"],
  ["Staff", "موظف"],
  ["Super Admin / System Administrator", "مدير النظام"],
  ["Supervisor", "مشرف"],
  ["Sign in / Login", "تسجيل الدخول"],
  ["Email", "البريد الإلكتروني"],
  ["Password", "كلمة المرور"],
  ["Dashboard", "لوحة التحكم"],
  ["Class (teaching session)", "حصة"],
  ["Schedule", "جدول"],
  ["Attendance", "الحضور"],
  ["Invoice", "فاتورة"],
  ["Subscription", "اشتراك"],
  ["Balance / credits", "الرصيد"],
  ["Notification", "إشعار"],
  ["Profile", "الملف الشخصي"],
  ["Status", "الحالة"],
  ["Filters", "الفلاتر"],
  ["Identifier / ID", "معرّف (always with shadda, never معرف)"],
  ["Payin / money collected from parents", "التحصيل"],
  ["Payout / money sent to teachers", "الصرف"],
  ["National ID", "الرقم القومي"],
  ["Advance class type (booked in advance)", "حصة مسبقة / مسبقة"],
  ["Trial class type", "حصة تجريبية / تجريبية (feminine for classes)"],
  ["Regular class type", "حصة عادية / عادية (feminine for classes)"],
  ["Person trial status badge", "تجريبي (masculine for people)"],
];

// ─── Types ──────────────────────────────────────────────────────────────────

export type EntryKind = "string" | "function" | "reference";

/** A single flattened locale entry extracted from a leaf module. */
export interface LocaleEntry {
  /** Dotted key path, e.g. `table.student`. */
  key: string;
  kind: EntryKind;
  /** Exact source slice from the file (for strings: the quoted literal;
   *  for functions: the full arrow-function source). */
  source: string;
}

export type EntryStatus = "unchanged" | "changed" | "invalid" | "error";

const ENTRY_STATUSES: readonly EntryStatus[] = ["unchanged", "changed", "invalid", "error"];

function emptyStats(): Record<EntryStatus, number> {
  return { unchanged: 0, changed: 0, invalid: 0, error: 0 };
}

/** One reviewed entry in the report. */
export interface ReportEntry {
  key: string;
  kind: EntryKind;
  /** English source text (decoded string) or English function source. */
  en: string;
  /** Current Arabic value (decoded string) or current function source. */
  current: string;
  /** Exact raw source slice in the current ar file — use as Edit old_string. */
  currentSource: string;
  /** Model proposal (decoded string) or proposed function source. */
  proposed: string;
  status: EntryStatus;
  notes: string[];
}

/** Per-file report. */
export interface FileReport {
  arFile: string;
  enFile: string;
  timestamp: string;
  model: string;
  entries: ReportEntry[];
  stats: Record<EntryStatus, number>;
}

// ─── Object-literal scanner ─────────────────────────────────────────────────

/** Skip a string literal starting at a quote char; returns index after it. */
function skipQuoted(src: string, i: number): number {
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

function isLineCommentAt(src: string, i: number): boolean {
  return src.startsWith("//", i);
}

function skipLineComment(src: string, i: number): number {
  const nl = src.indexOf("\n", i);
  return nl < 0 ? src.length : nl;
}

function isBlockCommentAt(src: string, i: number): boolean {
  return src.startsWith("/*", i);
}

function skipBlockComment(src: string, i: number): number {
  const end = src.indexOf("*/", i + 2);
  return end < 0 ? src.length : end + 2;
}

/** Skip a `${...}` interpolation expression. `i` points just after `${`;
 *  returns the index after the matching `}`. Handles nested braces, strings,
 *  templates, and comments inside the expression. */
function skipInterpolation(src: string, i: number): number {
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
function skipSpecial(src: string, i: number): number {
  const c = src[i];
  if (c === '"' || c === "'") return skipQuoted(src, i);
  if (c === "`") return skipTemplate(src, i);
  if (isLineCommentAt(src, i)) return skipLineComment(src, i);
  if (isBlockCommentAt(src, i)) return skipBlockComment(src, i);
  return i;
}

interface Depth {
  paren: number;
  bracket: number;
  brace: number;
}

function zeroDepth(): Depth {
  return { paren: 0, bracket: 0, brace: 0 };
}

function depthZero(d: Depth): boolean {
  return d.paren === 0 && d.bracket === 0 && d.brace === 0;
}

/** Apply one bracket-like char to the depth counters. */
function applyBracket(c: string, d: Depth): void {
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

const EXPORT_CONST_REGEX = /export\s+const\s+[A-Za-z_$][\w$]*/;

/** Find the `{` that opens the exported const's object literal. Locale leaf
 *  types are named interfaces, never inline object-literal types, so the
 *  first `{` after the export header is the object literal. */
function findRootObject(src: string): number {
  const m = EXPORT_CONST_REGEX.exec(src);
  if (!m) return -1;
  return src.indexOf("{", m.index + m[0].length);
}

const KEY_REGEX = /^(?:[A-Za-z_$][\w$]*|"[^"]+"|'[^']+')/;
const ARROW_REGEX = /=>/;

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
function translatable(entries: LocaleEntry[]): LocaleEntry[] {
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

// ─── Function-shape validation ──────────────────────────────────────────────

/** Extract `${...}` placeholder expression texts from a source slice.
 *  Strings are skipped; backticks are walked char-wise so template contents
 *  are still scanned. */
function extractPlaceholders(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i = skipQuoted(src, i);
      continue;
    }
    if (c === "$" && src[i + 1] === "{") {
      const end = skipInterpolation(src, i + 2);
      out.push(src.slice(i + 2, end - 1).trim());
      i = end;
      continue;
    }
    i++;
  }
  return out;
}

/** Extract the parameter identifier list from an arrow function source. */
function extractParams(fnSrc: string): string[] | null {
  const arrow = topLevelArrow(fnSrc);
  if (arrow < 0) return null;
  const head = fnSrc.slice(0, arrow).trim();
  if (!head) return null;
  if (head.startsWith("(")) {
    if (!head.endsWith(")")) return null;
    const inner = head.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map(p => p.split(":")[0].split("=")[0].trim());
  }
  return [head.split(":")[0].trim()];
}

/** Find a top-level `=>` (not inside strings/templates/nesting). */
function topLevelArrow(src: string): number {
  const d = zeroDepth();
  let i = 0;
  while (i < src.length - 1) {
    const skipped = skipSpecial(src, i);
    if (skipped > i) {
      i = skipped;
      continue;
    }
    if (depthZero(d) && src[i] === "=" && src[i + 1] === ">") return i;
    applyBracket(src[i], d);
    i++;
  }
  return -1;
}

const RETURN_REGEX = /\breturn\b/g;
const IF_REGEX = /\bif\s*\(/g;

function countMatches(src: string, re: RegExp): number {
  return [...src.matchAll(re)].length;
}

function isBalanced(src: string): boolean {
  const d = zeroDepth();
  let i = 0;
  while (i < src.length) {
    const skipped = skipSpecial(src, i);
    if (skipped > i) {
      i = skipped;
      continue;
    }
    applyBracket(src[i], d);
    if (d.paren < 0 || d.bracket < 0 || d.brace < 0) return false;
    i++;
  }
  return depthZero(d);
}

/** Validate a proposed function translation against the ENGLISH function.
 *  Returns notes; empty = clean. */
function validateFunctionProposal(enFn: string, proposed: string): string[] {
  const notes: string[] = [];
  if (topLevelArrow(proposed) < 0) {
    notes.push("proposal is not an arrow function");
    return notes;
  }
  if (!isBalanced(proposed)) notes.push("unbalanced braces/parens/brackets");

  const enParams = extractParams(enFn);
  const propParams = extractParams(proposed);
  if (enParams === null || propParams === null) {
    notes.push("could not extract parameter list");
  } else if (JSON.stringify(enParams) !== JSON.stringify(propParams)) {
    notes.push(`parameter list changed: (${enParams.join(", ")}) -> (${propParams.join(", ")})`);
  }

  const enPh = extractPlaceholders(enFn).toSorted((a, b) => a.localeCompare(b));
  const propPh = extractPlaceholders(proposed).toSorted((a, b) => a.localeCompare(b));
  if (JSON.stringify(enPh) !== JSON.stringify(propPh)) {
    notes.push(`\${...} placeholders differ: en=[${enPh.join(" | ")}] proposed=[${propPh.join(" | ")}]`);
  }

  const enReturns = countMatches(enFn, RETURN_REGEX);
  const propReturns = countMatches(proposed, RETURN_REGEX);
  if (enReturns !== propReturns) {
    notes.push(`return count changed: ${enReturns} -> ${propReturns}`);
  }
  const enIfs = countMatches(enFn, IF_REGEX);
  const propIfs = countMatches(proposed, IF_REGEX);
  if (enIfs !== propIfs) {
    notes.push(`if-branch count changed: ${enIfs} -> ${propIfs}`);
  }
  return notes;
}

/** Validate a proposed plain-string translation against the English text. */
function validateStringProposal(enText: string, proposed: string): string[] {
  const notes: string[] = [];
  if (!proposed.trim()) notes.push("proposal is empty");
  if (proposed === enText) {
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/u.test(enText);
    if (!hasArabic && enText.length > 3 && !/^\d+$/.test(enText)) {
      notes.push("proposal identical to English source (possibly untranslated)");
    }
  }
  if (proposed.includes("```")) notes.push("proposal contains markdown fences");
  return notes;
}

// ─── Model client ───────────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

const RETRY_DELAYS_MS = [2000, 5000];

async function retryAfter(url: string, init: RequestInit, attempt: number): Promise<Response> {
  const delay = RETRY_DELAYS_MS[attempt];
  logWarning(`retrying request in ${delay}ms (attempt ${attempt + 2})`);
  await sleep(delay);
  return fetchWithRetry(url, init, attempt + 1);
}

/**
 * Fetch with bounded retries. The local gateway occasionally returns
 * transient 5xx/timeouts when it cold-starts a model; HTTP 429/5xx and
 * network errors are retried with 2s/5s backoff.
 */
async function fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (attempt >= RETRY_DELAYS_MS.length) throw err;
    return retryAfter(url, init, attempt);
  }
  const exhausted = attempt >= RETRY_DELAYS_MS.length;
  if (res.ok || !isRetryableStatus(res.status) || exhausted) return res;
  return retryAfter(url, init, attempt);
}

async function callModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: TEMPERATURE,
      max_tokens: maxTokens,
      // omniroute injects tool_choice:"auto" by default, which vLLM rejects.
      tool_choice: "none",
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail.slice(0, 500)}`);
  }
  const data: unknown = await res.json();
  const content = extractAssistantContent(data);
  if (typeof content !== "string") throw new Error("empty model response");
  return content;
}

/** Pull `choices[0].message.content` out of the wire payload without type
 *  assertions — uses `in` narrowing and `Array.isArray` throughout. */
function extractAssistantContent(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("choices" in data)) {
    return undefined;
  }
  const choices: unknown = data.choices;
  if (!Array.isArray(choices)) return undefined;
  const first: unknown = choices[0];
  if (typeof first !== "object" || first === null || !("message" in first)) {
    return undefined;
  }
  const message: unknown = first.message;
  if (typeof message !== "object" || message === null || !("content" in message)) {
    return undefined;
  }
  const content: unknown = message.content;
  return typeof content === "string" ? content : undefined;
}

function stripFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.slice(t.indexOf("\n") + 1);
    const end = t.lastIndexOf("```");
    if (end >= 0) t = t.slice(0, end);
  }
  return t.trim();
}

function isStringKeyedObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseModelJson(raw: string): Record<string, unknown> {
  const clean = stripFences(raw);
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in response");
  const parsed: unknown = JSON.parse(clean.slice(start, end + 1));
  if (!isStringKeyedObject(parsed)) {
    throw new Error("response is not a JSON object");
  }
  return parsed;
}

function buildSystemPrompt(): string {
  const glossary = GLOSSARY.map(([en, ar]) => `- ${en} = ${ar}`).join("\n");
  return [
    `You are a localization engine for "Siraj", an Arabic-first education`,
    `management system (LMS). You receive a JSON array of entries:`,
    `[{ "key", "kind", "en", "current" }]`,
    `- kind "string": "en" is the English UI text, "current" is the existing`,
    `  Arabic text.`,
    `- kind "function": "en" is a TypeScript arrow function returning user-facing`,
    `  English text (interpolation / pluralization); "current" is the existing`,
    `  Arabic function source code.`,
    ``,
    `Reply with a JSON object mapping each key to your value:`,
    `- strings: the Arabic text.`,
    `- functions: the COMPLETE arrow-function source, translating ONLY the`,
    `  string literals. Parameter names, control flow, comparisons, and every`,
    `  \${...} expression MUST stay byte-identical to the English structure.`,
    ``,
    `Rules:`,
    `- MINIMAL DIFFS: if "current" is already correct, natural, and consistent,`,
    `  return it VERBATIM. Only change what is wrong, awkward, or inconsistent.`,
    `- Modern Standard Arabic, professional UI tone, RTL-correct punctuation`,
    `  (use ؟ ! and Arabic-appropriate phrasing, not English word order).`,
    `- Never transliterate an English term when an Arabic equivalent exists.`,
    `- Respect gender agreement with the Arabic head noun in context`,
    `  (e.g. password-strength adjectives agree with قوة: ضعيفة / مقبولة / قوية).`,
    `- Keep digits as digits; keep brand names (e.g. Siraj LMS) unchanged.`,
    `- ALWAYS use Western digits (0-9), never Eastern Arabic numerals (٠١٢).`,
    `- Terminology glossary (use these EXACT renderings):`,
    glossary,
    `- Output ONLY the JSON object. No markdown fences, no commentary.`,
  ].join("\n");
}

// ─── File discovery ─────────────────────────────────────────────────────────

/** Recursively collect ar leaf files (skips aggregators naturally: they parse
 *  to zero entries and are skipped at report time). */
function collectFiles(target: string): string[] {
  if (!existsSync(target)) throw new Error(`path not found: ${target}`);
  const out: string[] = [];
  const walk = (p: string): void => {
    if (!existsSync(p)) return;
    if (p.endsWith(".ts")) {
      out.push(p);
      return;
    }
    for (const name of readdirSync(p, { withFileTypes: true })) {
      if (name.name === "messages.ts") continue;
      walk(join(p, name.name));
    }
  };
  walk(target);
  return out.toSorted((a, b) => a.localeCompare(b));
}

// ─── Per-file pipeline ──────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function translateChunk(
  entries: LocaleEntry[],
  enEntry: Map<string, LocaleEntry>,
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<{ parsed: Record<string, unknown>; raw: string }> {
  const payload = entries.map(e => {
    const en = enEntry.get(e.key);
    return {
      key: e.key,
      kind: e.kind,
      en: en ? decodeValue(en) : "",
      current: decodeValue(e),
    };
  });
  const system = buildSystemPrompt();
  const user = JSON.stringify(payload, null, 1);
  const raw = await callModel(
    baseUrl,
    apiKey,
    model,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    estimateMaxTokens(entries)
  );
  let parsed: Record<string, unknown>;
  try {
    parsed = parseModelJson(raw);
  } catch (firstErr) {
    // One retry with a correction note.
    const retry = await callModel(
      baseUrl,
      apiKey,
      model,
      [
        { role: "system", content: system },
        { role: "user", content: user },
        { role: "user", content: "Reply with ONLY the JSON object, no commentary." },
      ],
      estimateMaxTokens(entries)
    );
    try {
      parsed = parseModelJson(retry);
      return { parsed, raw: retry };
    } catch {
      throw firstErr;
    }
  }
  return { parsed, raw };
}

function buildReportEntry(ar: LocaleEntry, enEntry: Map<string, LocaleEntry>, proposed: unknown): ReportEntry {
  const en = enEntry.get(ar.key);
  const enText = en ? decodeValue(en) : "";
  const base: ReportEntry = {
    key: ar.key,
    kind: ar.kind,
    en: enText,
    current: decodeValue(ar),
    currentSource: ar.source,
    proposed: "",
    status: "invalid",
    notes: [],
  };
  if (!en) {
    base.notes.push("no English counterpart entry found");
    return base;
  }
  if (typeof proposed !== "string") {
    base.notes.push("model response missing this key or value is not a string");
    return base;
  }
  const clean = stripFences(proposed).trim();
  base.proposed = clean;
  if (clean === base.current) {
    base.status = "unchanged";
    return base;
  }
  const notes =
    ar.kind === "function" ? validateFunctionProposal(enText, clean) : validateStringProposal(enText, clean);
  base.notes = notes;
  base.status = notes.length === 0 ? "changed" : "invalid";
  return base;
}

/** Translate one ar leaf file and return its report (never writes repo files). */
export async function translateFile(
  absArPath: string,
  enRoot: string,
  baseUrl: string,
  apiKey: string,
  model: string,
  rawDir: string
): Promise<FileReport> {
  const rel = relative(resolve(AR_ROOT), absArPath);
  const enPath = join(enRoot, rel);
  const arSrc = readFileSync(absArPath, "utf-8");
  const arAll = parseLocaleFile(arSrc);
  const arEntries = translatable(arAll);
  const skippedRefs = arAll.length - arEntries.length;
  if (skippedRefs > 0) logInfo(`  ${rel}: skipping ${skippedRefs} code-reference entries`);
  const enEntries = existsSync(enPath) ? parseLocaleFile(readFileSync(enPath, "utf-8")) : [];
  const enMap = new Map(translatable(enEntries).map(e => [e.key, e]));

  /** Process one chunk sequentially — model calls are deliberately serialized
   *  to avoid hammering the local gateway. */
  const processChunk = (piece: LocaleEntry[], idx: number): Promise<ReportEntry[]> =>
    translateChunk(piece, enMap, baseUrl, apiKey, model)
      .then(({ parsed }) => piece.map(e => buildReportEntry(e, enMap, parsed[e.key])))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        logError(`${rel} chunk ${idx + 1}/${chunks.length}: ${msg}`);
        if (msg.includes("no JSON object")) {
          mkdirSync(rawDir, { recursive: true });
          const safe = `${rel.replaceAll("/", "__")}.chunk${idx + 1}.txt`;
          writeFileSync(join(rawDir, safe), `error: ${msg}\n`);
        }
        return piece.map(e => {
          const en = enMap.get(e.key);
          return {
            key: e.key,
            kind: e.kind,
            en: en ? decodeValue(en) : "",
            current: decodeValue(e),
            currentSource: e.source,
            proposed: "",
            status: "error" as const,
            notes: [msg],
          };
        });
      });

  const chunks = chunk(arEntries, CHUNK_SIZE);
  const entries = await chunks.reduce<Promise<ReportEntry[]>>(
    async (acc, piece, idx) => [...(await acc), ...(await processChunk(piece, idx))],
    Promise.resolve([])
  );

  const stats = emptyStats();
  for (const e of entries) stats[e.status]++;

  return {
    arFile: absArPath,
    enFile: enPath,
    timestamp: new Date().toISOString(),
    model,
    entries,
    stats,
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function printHelp(): void {
  const lines = [
    "TRANSLATE-LOCALE-AR — review report generator for shared/locale/ar",
    "",
    "Usage:",
    "  bun run scripts/translate-locale-ar.ts <file-or-dir> [more paths...]",
    "  bun run scripts/translate-locale-ar.ts --all",
    "  bun run scripts/translate-locale-ar.ts --all --list",
    "",
    "Options:",
    "  --all                Process every leaf file under shared/locale/ar",
    "  --list               Only list matching files (no API calls)",
    "  --resume             With --out-dir of a previous run: skip files that",
    "                       already have an error-free report; re-run only the",
    "                       missing/failed ones. Safe after interrupted runs.",
    "  --out-dir <dir>      Report directory (default scratch/locale-ar/<timestamp>)",
    "  --model <id>         Model id (default " + DEFAULT_MODEL + ")",
    "  --help, -h           Show this help",
    "",
    "Env: TRANSLATE_API_KEY (required), TRANSLATE_BASE_URL (default",
    "     " + DEFAULT_BASE_URL + "), TRANSLATE_MODEL",
    "",
    "The script NEVER writes to shared/locale. Reports only.",
  ];
  for (const line of lines) logInfo(line);
}

interface FileOutcome {
  file: string;
  stats: Record<EntryStatus, number>;
}

interface RunCtx {
  baseUrl: string;
  apiKey: string;
  model: string;
  rawDir: string;
  absOut: string;
  total: number;
}

/** Keep files that have at least one translatable entry (aggregator modules
 *  with only re-exports are reported and skipped). */
/** Keep only leaf files that have at least one translatable entry (aggregator
 *  modules contain only references and report zero). */
function collectLeaves(files: string[]): string[] {
  const leaves: string[] = [];
  for (const f of files) {
    const entries = parseLocaleFile(readFileSync(f, "utf-8"));
    if (translatable(entries).length === 0) {
      logWarning(`skip (no translatable entries): ${f}`);
    } else {
      leaves.push(f);
    }
  }
  return leaves;
}

/** Resolve the report output dir; refuses anything under shared/locale. */
function resolveReportDir(outDirArg: string | undefined): string {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const absOut = resolve(outDirArg ?? `${DEFAULT_OUT_PREFIX}/${stamp}`);
  if (absOut.startsWith(resolve(LOCALE_ROOT))) {
    throw new Error("Refusing to write reports inside shared/locale.");
  }
  return absOut;
}

/** Build the run context; throws when credentials/config are missing. */
function buildRunCtx(modelArg: string | undefined, outDirArg: string | undefined, total: number): RunCtx {
  const apiKey = process.env.TRANSLATE_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("TRANSLATE_API_KEY is not set. Ask the user for the gateway key.");
  }
  const absOut = resolveReportDir(outDirArg);
  const rawDir = join(absOut, "raw");
  mkdirSync(rawDir, { recursive: true });
  return {
    baseUrl: process.env.TRANSLATE_BASE_URL ?? DEFAULT_BASE_URL,
    apiKey,
    model: modelArg ?? process.env.TRANSLATE_MODEL ?? DEFAULT_MODEL,
    rawDir,
    absOut,
    total,
  };
}

async function runOneFile(file: string, i: number, ctx: RunCtx): Promise<FileOutcome | null> {
  logInfo(`[${i + 1}/${ctx.total}] ${file}`);
  try {
    const report = await translateFile(file, resolve(EN_ROOT), ctx.baseUrl, ctx.apiKey, ctx.model, ctx.rawDir);
    const rel = relative(resolve(AR_ROOT), file).replace(/\.ts$/, ".json");
    const outPath = join(ctx.absOut, rel);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    logSuccess(
      `  -> ${outPath} (changed=${report.stats.changed} unchanged=${report.stats.unchanged} invalid=${report.stats.invalid} error=${report.stats.error})`
    );
    return { file, stats: report.stats };
  } catch (err) {
    logError(`  FAILED ${file}: ${String(err instanceof Error ? err.message : err)}`);
    return null;
  }
}

/** Sequential on purpose: one file at a time keeps gateway load predictable. */
async function runAllFiles(leaves: string[], ctx: RunCtx): Promise<Array<FileOutcome | null>> {
  return leaves.reduce<Promise<Array<FileOutcome | null>>>(
    async (acc, file, i) => [...(await acc), await runOneFile(file, i, ctx)],
    Promise.resolve([])
  );
}

function sumTotals(perFile: FileOutcome[]): Record<EntryStatus, number> {
  const totals = emptyStats();
  for (const r of perFile) {
    for (const k of ENTRY_STATUSES) totals[k] += r.stats[k];
  }
  return totals;
}

/**
 * Whether a leaf still needs processing under `--resume`: true when no report
 * exists yet or the existing report carries any `error` entries (transient
 * gateway failures). Reports with `invalid` entries count as DONE — those are
 * review signals, not failures, and re-running would just churn cost.
 */
function needsRerun(reportPath: string): boolean {
  if (!existsSync(reportPath)) return true;
  try {
    const parsed: unknown = JSON.parse(readFileSync(reportPath, "utf-8"));
    if (!isStringKeyedObject(parsed)) return true;
    const stats: unknown = parsed.stats;
    if (!isStringKeyedObject(stats)) return true;
    return typeof stats.error !== "number" || stats.error > 0;
  } catch {
    return true;
  }
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      all: { type: "boolean", default: false },
      list: { type: "boolean", default: false },
      resume: { type: "boolean", default: false },
      "out-dir": { type: "string" },
      model: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) {
    printHelp();
    return 0;
  }
  if (!values.all && positionals.length === 0) {
    printHelp();
    return 1;
  }

  const targets = values.all ? [AR_ROOT] : positionals;
  const files = targets.flatMap(t => collectFiles(resolve(t)));
  logInfo(`${files.length} candidate file(s)`);

  const leaves = collectLeaves(files);
  logInfo(`${leaves.length} leaf file(s) with translatable entries`);
  if (values.list) {
    for (const f of leaves) logInfo(`  ${f}`);
    return 0;
  }

  const ctx = buildRunCtx(values.model, values["out-dir"], leaves.length);
  let toRun = leaves;
  if (values.resume) {
    toRun = leaves.filter(f => needsRerun(join(ctx.absOut, relative(resolve(AR_ROOT), f).replace(/\.ts$/, ".json"))));
    logInfo(`resume: ${leaves.length - toRun.length} already done, ${toRun.length} to process`);
    if (toRun.length === 0) {
      logSuccess("Nothing to do — every leaf has a clean report.");
      return 0;
    }
  }
  ctx.total = toRun.length;
  const outcomes = await runAllFiles(toRun, ctx);
  const perFile = outcomes.filter(r => r !== null);
  const totals = sumTotals(perFile);

  writeFileSync(
    join(ctx.absOut, "_summary.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        model: ctx.model,
        fileCount: perFile.length,
        totals,
        files: perFile,
      },
      null,
      2
    )
  );
  logSuccess(`Summary: ${join(ctx.absOut, "_summary.json")}`);
  logInfo(
    `Totals: changed=${totals.changed} unchanged=${totals.unchanged} invalid=${totals.invalid} error=${totals.error}`
  );
  return 0;
}

main()
  .then(code => {
    process.exit(code);
  })
  .catch((err: unknown) => {
    logError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
