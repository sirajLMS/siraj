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
 * Usage from a sub-agent (PowerShell):
 *   $body = @{ id = "phase8"; files = @("src/foo.ts","src/bar.ts") } | ConvertTo-Json
 *   Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
 *
 * Usage from TypeScript:
 *   import { requestLint } from "@/scripts/lint-queue-client";
 *   const result = await requestLint("phase8", ["src/foo.ts", "src/bar.ts"]);
 *   console.log(result.success, result.exitCode);
 */

const BASE_URL = "http://localhost:4777";

/**
 * Submit a lint request to the queue server. Blocks until the lint run completes.
 *
 * @param id - Arbitrary identifier for log correlation (e.g., "phase8")
 * @param files - Array of file paths to lint
 * @returns LintResult with success flag, combined output, and exit code
 * @throws Error if the server returns a non-200 status
 */
export async function requestLint(
  id: string,
  files: string[]
): Promise<{ success: boolean; output: string; exitCode: number }> {
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
 * Check the current state of the lint queue server.
 *
 * @returns Object with `running` (whether a lint process is active) and
 *          `queueLength` (number of pending requests)
 */
export async function getQueueStatus(): Promise<{ running: boolean; queueLength: number }> {
  const response = await fetch(`${BASE_URL}/status`);
  return response.json();
}
