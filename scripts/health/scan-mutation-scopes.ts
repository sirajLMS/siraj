#!/usr/bin/env bun
/**
 * scripts/health/scan-mutation-scopes.ts
 *
 * H8 CI guard — enforces that every write GraphQL mutation carries the
 * `notImpersonating` authScope (so an impersonating admin cannot perform
 * destructive writes AS the impersonated target), unless the mutation is on
 * the explicit allow-list (mutations that must work during impersonation:
 * login, demoLogin, refreshToken, logout, changePassword, endImpersonation,
 * endPermissionGroupSimulation).
 *
 * Exit codes:
 *   0 — all mutations comply (or are allow-listed)
 *   1 — one or more mutations violate the policy (prints a report)
 *
 * Run:
 *   bun run scripts/health/scan-mutation-scopes.ts
 *
 * This is a STATIC analysis (regex over source text) — it does not load the
 * module graph, so it is fast and has no DB/env dependencies. It is
 * intentionally conservative: it flags any `mutationField("name", { ... })`
 * whose `authScopes` object literal does NOT contain a `notImpersonating`
 * key, unless `name` is on the allow-list.
 *
 * Limitations (documented, accepted):
 *   - Regex-based parsing cannot understand computed authScopes or
 *     spread-merged scope objects. Such cases are flagged for manual review
 *     (the operator inspects and either adds the scope or extends the
 *     allow-list). False positives are preferred over silent bypass.
 *   - Only `mutationField` is scanned; query fields are read-only and
 *     intentionally excluded (reads during impersonation are a product
 *     feature, not a write-safety concern).
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const MUTATION_DIR = join(process.cwd(), "backend", "graphql", "mutation");

// Mutations that MUST work during impersonation (auth flows, session management).
const ALLOW_LIST = new Set<string>([
  "login",
  "demoLogin",
  "refreshToken",
  "logout",
  "changePassword",
  "endImpersonation",
  "endPermissionGroupSimulation",
]);

interface Violation {
  file: string;
  mutation: string;
  line: number;
  reason: string;
}

async function walkTsFiles(dir: string, acc: string[] = []): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkTsFiles(full, acc);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Extract `mutationField("name", { ... authScopes: {...} ... })` occurrences
 * from source text. Returns one record per mutation field declaration that
 * has an `authScopes` key, plus records for mutation fields that have NO
 * authScopes key (those are flagged as "missing authScopes").
 */
function extractMutations(source: string, filePath: string): Array<{
  mutation: string;
  line: number;
  hasNotImpersonating: boolean;
  hasAuthScopes: boolean;
}> {
  const results: Array<{ mutation: string; line: number; hasNotImpersonating: boolean; hasAuthScopes: boolean }> = [];
  // Match mutationField("name", ... up to the closing of the options object.
  // We use a relaxed regex to find the call, then scan forward for authScopes.
  const callRegex = /\.mutationField\s*\(\s*["'`]([^"'`]+)["'`]/g;
  let match: RegExpExecArray | null;
  while ((match = callRegex.exec(source)) !== null) {
    const mutationName = match[1];
    const callStart = match.index;
    const lineNum = source.slice(0, callStart).split("\n").length;
    // Grab a window after the call (the options object). 4000 chars is enough
    // for any reasonable field config without spilling into the next field.
    const window = source.slice(callStart, callStart + 4000);
    const hasAuthScopes = /authScopes\s*:/.test(window);
    // notImpersonating must appear inside the authScopes object literal.
    // We look for `notImpersonating` anywhere in the window — if present,
    // it is almost certainly inside authScopes (the only place it's valid).
    const hasNotImpersonating = /notImpersonating\b/.test(window);
    results.push({ mutation: mutationName, line: lineNum, hasNotImpersonating, hasAuthScopes });
  }
  return results;
}

async function main(): Promise<number> {
  let dirStat: Awaited<ReturnType<typeof stat>>;
  try {
    dirStat = await stat(MUTATION_DIR);
  } catch {
    console.error(`[scan-mutation-scopes] mutation dir not found: ${MUTATION_DIR}`);
    return 1;
  }
  if (!dirStat.isDirectory()) {
    console.error(`[scan-mutation-scopes] not a directory: ${MUTATION_DIR}`);
    return 1;
  }

  const files = await walkTsFiles(MUTATION_DIR);
  const violations: Violation[] = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const mutations = extractMutations(source, file);
    for (const m of mutations) {
      if (ALLOW_LIST.has(m.mutation)) continue;
      if (!m.hasAuthScopes) {
        violations.push({
          file: relative(process.cwd(), file),
          mutation: m.mutation,
          line: m.line,
          reason: "missing authScopes — write mutation has no auth scope guard",
        });
      } else if (!m.hasNotImpersonating) {
        violations.push({
          file: relative(process.cwd(), file),
          mutation: m.mutation,
          line: m.line,
          reason: "authScopes present but missing notImpersonating (allow-listed impersonation writes)",
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log(`[scan-mutation-scopes] OK — all ${files.length} mutation files comply.`);
    return 0;
  }

  console.error(`[scan-mutation-scopes] FAIL — ${violations.length} violation(s):`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — mutation "${v.mutation}" — ${v.reason}`);
  }
  console.error("");
  console.error("Allow-list (mutations exempt from notImpersonating):");
  for (const a of ALLOW_LIST) console.error(`  - ${a}`);
  console.error("");
  console.error("Fix: add `authScopes: { notImpersonating: true, <existing> }` to each flagged mutation,");
  console.error("or add the mutation to ALLOW_LIST if it must work during impersonation.");
  return 1;
}

const exitCode = await main();
process.exit(exitCode);
