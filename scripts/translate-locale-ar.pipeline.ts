import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { logError, logInfo, logSuccess, logWarning } from "@/scripts/health/__shared__/log";
import {
  AR_ROOT,
  CHUNK_SIZE,
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  DEFAULT_OUT_PREFIX,
  EN_ROOT,
  LOCALE_ROOT,
} from "@/scripts/translate-locale-ar.constants";
import {
  buildSystemPrompt,
  callModel,
  estimateMaxTokens,
  isStringKeyedObject,
  parseModelJson,
  stripFences,
} from "@/scripts/translate-locale-ar.model-client";
import { decodeValue, parseLocaleFile, translatable } from "@/scripts/translate-locale-ar.scanner";
import type {
  ChatMessage,
  EntryStatus,
  FileReport,
  LocaleEntry,
  ReportEntry,
} from "@/scripts/translate-locale-ar.types";
import { validateFunctionProposal, validateStringProposal } from "@/scripts/translate-locale-ar.validation";

// ─── File discovery ─────────────────────────────────────────────────────────

/** Recursively collect ar leaf files (skips aggregators naturally: they parse
 *  to zero entries and are skipped at report time). */
export function collectFiles(target: string): string[] {
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

export const ENTRY_STATUSES: readonly EntryStatus[] = ["unchanged", "changed", "invalid", "error"];

function emptyStats(): Record<EntryStatus, number> {
  return { unchanged: 0, changed: 0, invalid: 0, error: 0 };
}

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
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  const raw = await callModel(baseUrl, apiKey, model, messages, estimateMaxTokens(entries));
  let parsed: Record<string, unknown>;
  try {
    parsed = parseModelJson(raw);
  } catch (firstErr) {
    // One retry with a correction note.
    const retry = await callModel(
      baseUrl,
      apiKey,
      model,
      [...messages, { role: "user", content: "Reply with ONLY the JSON object, no commentary." }],
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

  const chunks = chunk(arEntries, CHUNK_SIZE);

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

// ─── Run orchestration ──────────────────────────────────────────────────────

export interface FileOutcome {
  file: string;
  stats: Record<EntryStatus, number>;
}

export interface RunCtx {
  baseUrl: string;
  apiKey: string;
  model: string;
  rawDir: string;
  absOut: string;
  total: number;
}

/** Keep only leaf files that have at least one translatable entry (aggregator
 *  modules contain only references and report zero). */
export function collectLeaves(files: string[]): string[] {
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
export function resolveReportDir(outDirArg: string | undefined): string {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const absOut = resolve(outDirArg ?? `${DEFAULT_OUT_PREFIX}/${stamp}`);
  if (absOut.startsWith(resolve(LOCALE_ROOT))) {
    throw new Error("Refusing to write reports inside shared/locale.");
  }
  return absOut;
}

/** Build the run context; throws when credentials/config are missing. */
export function buildRunCtx(modelArg: string | undefined, outDirArg: string | undefined, total: number): RunCtx {
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

export async function runOneFile(file: string, i: number, ctx: RunCtx): Promise<FileOutcome | null> {
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
export async function runAllFiles(leaves: string[], ctx: RunCtx): Promise<Array<FileOutcome | null>> {
  return leaves.reduce<Promise<Array<FileOutcome | null>>>(
    async (acc, file, i) => [...(await acc), await runOneFile(file, i, ctx)],
    Promise.resolve([])
  );
}

export function sumTotals(perFile: FileOutcome[]): Record<EntryStatus, number> {
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
export function needsRerun(reportPath: string): boolean {
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
