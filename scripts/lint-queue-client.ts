/**
 * Lint Queue Client — Helper for Sub-Agents to Use the Serialized Lint Server
 *
 * This module provides typed functions for sub-agents (or any caller) to
 * submit lint requests to the lint-queue-server and retrieve results without
 * needing to craft raw HTTP calls.
 *
 * The lint queue server MUST be running before these functions are called:
 *   `~/.bun/bin/bun run scripts/lint-queue-server.ts`
 *
 * Note: `package.json`'s `lint` script imports `requestFullRepoLint` from
 * this file, so `bun run lint` IS the lint queue client — running it directly
 * is safe and goes through the queue. Use `requestLint(id, [files])` below
 * for file-scoped lint (faster when a caller only touched a handful of files).
 *
 * Usage from a sub-agent (PowerShell):
 *   $body = @{ id = "phase8"; files = @("src/foo.ts","src/bar.ts") } | ConvertTo-Json
 *   Invoke-RestMethod -Uri http://localhost:${LINT_QUEUE_PORT}/lint -Method POST -ContentType 'application/json' -Body $body
 *
 * Usage from TypeScript:
 *   import { requestLint, requestFullRepoLint } from "@/scripts/lint-queue-client";
 *   // Lint specific files
 *   const r1 = await requestLint("phase8", ["src/foo.ts", "src/bar.ts"]);
 *   // Lint whole repo via eslint config's files/ignores block (no "." arg)
 *   const r2 = await requestFullRepoLint("phase8");
 */

import { BASE_URL } from "./lint-queue-config";

/** Shape of the lint execution result returned by the queue server. */
export type LintResult = { success: boolean; output: string; exitCode: number };

/**
 * Submit a lint request to the queue server. Blocks until the lint run completes.
 *
 * @param id - Arbitrary identifier for log correlation (e.g., "phase8")
 * @param files - Array of file paths to lint. Pass an empty array (or omit) to
 *                lint the whole repo via eslint config's files/ignores block —
 *                prefer `requestFullRepoLint` for that case to be explicit.
 * @returns LintResult with success flag, combined output, and exit code
 * @throws Error if the server returns a non-200 status
 */
export async function requestLint(id: string, files: string[] = []): Promise<LintResult> {
  const response = await fetch(`${BASE_URL}/lint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, files }),
  });
  if (!response.ok) {
    throw new Error(`Lint queue request failed for ${id}: ${response.status}`);
  }
  return response.json();
}

/**
 * Submit a full-repo lint request. The server invokes eslint with NO file args,
 * which makes eslint honor the `files`/`ignores` block in eslint.config.js
 * (the only fully ignore-honoring way to lint the whole repo — passing `"."`
 * as a literal arg interacts poorly with cache + ignore semantics).
 *
 * @param id - Arbitrary identifier for log correlation (e.g., "cli-full")
 * @returns LintResult with success flag, combined output, and exit code
 * @throws Error if the server returns a non-200 status
 */
export async function requestFullRepoLint(id: string): Promise<LintResult> {
  return requestLint(id, []);
}

/**
 * Check the current state of the lint queue server.
 *
 * @returns Object with `running` (whether a lint process is active) and
 *          `queueLength` (number of pending requests)
 */
export async function getQueueStatus(): Promise<{ running: boolean; queueLength: number }> {
  const response = await fetch(`${BASE_URL}/status`);
  return response.json();
}
