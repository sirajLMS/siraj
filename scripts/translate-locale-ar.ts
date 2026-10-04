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

import { writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { logError, logInfo, logSuccess } from "@/scripts/health/__shared__/log";
import { AR_ROOT, DEFAULT_BASE_URL, DEFAULT_MODEL } from "@/scripts/translate-locale-ar.constants";
import {
  buildRunCtx,
  collectFiles,
  collectLeaves,
  needsRerun,
  runAllFiles,
  sumTotals,
} from "@/scripts/translate-locale-ar.pipeline";

export { translateFile } from "@/scripts/translate-locale-ar.pipeline";
export { decodeValue, parseLocaleFile } from "@/scripts/translate-locale-ar.scanner";
export type {
  EntryKind,
  EntryStatus,
  FileReport,
  LocaleEntry,
  ReportEntry,
} from "@/scripts/translate-locale-ar.types";

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
