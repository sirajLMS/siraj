/**
 * Shared types and command-runner helpers for the sub-loop family of scripts.
 *
 * Used by both `scripts/health/sub-loop.ts` and
 * `scripts/health/sub-loop-uncommitted.ts` to eliminate duplication of the
 * `Lifecycle` type, the `CheckResult` interface, and the synchronous
 * command-runner helpers (`runCommand`, `exitCodePassed`).
 *
 * Conventions:
 *   • Imports use the `@/` path alias, consistent with the rest of
 *     `scripts/health/` (see `scripts/health/__shared__/log.ts`).
 *   • No `as` type assertions and no `oxlint-disable` comments — type guards
 *     and `instanceof` are used instead (see AGENTS.md "Oxlint Rules").
 *   • `runCommand` preserves the exact `spawnSync` exit-code parsing and
 *     output combining behaviour from the original call sites, including the
 *     50MB `maxBuffer` that `sub-loop-uncommitted.ts` relies on for large
 *     project-wide outputs (e.g. tsgo on the whole repo). `sub-loop.ts`
 *     previously relied on Node's default 1MB buffer; using the larger
 *     shared buffer only allows more output to be captured without
 *     silently truncating, and does not regress the standard path.
 */

import { spawnSync } from "node:child_process";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Progressive quality-check lifecycle stages.
 *
 * Stages are ordered by depth (see `LIFECYCLE_ORDER`):
 *   • `tsgo`          — type-checking only
 *   • `biome`         — tsgo → oxlint → biome:check
 *   • `lint`          — tsgo → oxlint → biome:check → lint:type-aware
 *   • `codescene`     — full chain including check:duplicates and codescene --file
 *   • `sonar-results` — alias for `codescene` (subagents NEVER run sonar;
 *                       only the quality-gate orchestrator handles sonar).
 *
 * Both `sub-loop.ts` and `sub-loop-uncommitted.ts` accept all five stages;
 * `sub-loop.ts` previously kept `"sonar-results"` out of its `Lifecycle`
 * union but still validated it via a separate `VALID_LIFECYCLES` array.
 * Centralising the type here makes the union the single source of truth.
 */
export type Lifecycle = "tsgo" | "biome" | "lint" | "codescene" | "sonar-results";

/**
 * Outcome of a single quality check.
 *
 * This is the per-file shape used by `sub-loop.ts`. Batch-mode callers
 * (e.g. `sub-loop-uncommitted.ts`) extend this interface locally to add
 * `failedFiles: string[]` for per-file failure tracking.
 */
export interface CheckResult {
  /** Human-readable name of the check (e.g. `"tsgo"`, `"codescene --file"`). */
  name: string;
  /** Whether the check passed. */
  passed: boolean;
  /** Captured output (filtered for the target file(s) when applicable). */
  output: string;
}

/**
 * Raw result of a synchronous child-process spawn.
 *
 * `exitCode` is `null` when the process was killed by a signal or could not
 * be spawned (mirrors `spawnSync`'s `result.status`).
 */
export interface CommandRunResult {
  exitCode: number | null;
  output: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * Project root used as the `cwd` for spawned commands. Captured at module
 * load time, matching the original behaviour of both call sites
 * (`const PROJECT_ROOT = process.cwd();`).
 */
const PROJECT_ROOT = process.cwd();

/**
 * 50MB buffer for `spawnSync` stdio capture. Large enough for project-wide
 * tool output (e.g. tsgo on the whole repo) without silent truncation.
 */
const MAX_OUTPUT_BUFFER = 50 * 1024 * 1024;

// ─── Command Runner ─────────────────────────────────────────────────────────

/**
 * Run a command synchronously and capture its combined stdout/stderr output.
 *
 * Behaviour preserved from the original implementations:
 *   • Uses `spawnSync` with `encoding: "utf8"`.
 *   • `cwd` is the project root (captured at module load).
 *   • stdio is piped (no inheritance) so output can be captured and filtered.
 *   • `exitCode` is `result.status` (number on normal exit, `null` if
 *     signalled or unspawnable).
 *   • `output` is `(stdout || "") + (stderr || "")` — never `null`/`undefined`.
 *   • `maxBuffer` is 50MB (matches `sub-loop-uncommitted.ts`; for
 *     `sub-loop.ts` this only increases the truncation ceiling).
 *
 * Oxlint note: no `as` assertions are used — `result.status` is already
 * typed as `number | null` by Node's `spawnSync` typings.
 */
export function runCommand(command: string, args: string[]): CommandRunResult {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: PROJECT_ROOT,
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: MAX_OUTPUT_BUFFER,
  });

  return {
    exitCode: result.status,
    output: (result.stdout || "") + (result.stderr || ""),
  };
}

/**
 * Returns `true` when the given exit code indicates success (i.e. `0`).
 *
 * Treats `null` (signalled/unspawnable) as failure, matching the original
 * implementations and the conventional Unix exit-code semantics.
 */
export function exitCodePassed(exitCode: number | null): boolean {
  return exitCode === 0;
}
