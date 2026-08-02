/**
 * Lint Queue Server — Serialized ESLint Execution for Concurrent Sub-Agents
 *
 * When multiple AI sub-agents run in parallel and each invokes eslint at the
 * same time, they cause severe resource contention and intermittent failures.
 * This HTTP server serializes lint requests so only one eslint process runs
 * at a time, while all callers wait for their turn and receive results.
 *
 * Relationship to `bun run lint`:
 *   - `package.json` defines `lint` as a thin wrapper that imports
 *     `requestFullRepoLint` from `scripts/lint-queue-client.ts` and POSTs to
 *     this server. So `bun run lint` IS the lint queue client — running it
 *     directly is safe and is the documented way to lint the whole repo.
 *   - File-scoped lint should call `requestLint(id, [files])` from
 *     `scripts/lint-queue-client.ts` (or the equivalent HTTP call below) so
 *     eslint doesn't walk the whole repo.
    10| *
 * Architecture:
 *   - Single-threaded FIFO queue backed by a `running` flag
 *   - POST /lint  → Enqueue a lint request; blocks until the result is ready
 *   - GET  /status → Returns `{ running, queueLength }` for health checks
 *
 * Request body (POST /lint):
 *   { id: string, files?: string[] }
 *   - `id`      — Arbitrary caller identifier (used for log correlation)
 *   - `files`   — Optional array of file paths to lint.
 *                 When omitted or empty, eslint is invoked with no file args,
 *                 which makes it honor the `files`/`ignores` block in
 *                 eslint.config.js (i.e. lint the whole repo via config — the
 *                 ONLY safe way to do a full-repo lint, since passing `"."` as
 *                 a literal arg bypasses some ignore semantics).
 *
 * Response body (POST /lint):
 *   { success: boolean, output: string, exitCode: number }
 *
 * Usage:
 *   1. Start the server:  `~/.bun/bin/bun run scripts/lint-queue-server.ts`
 *   2. From any sub-agent or shell:
 *      $body = @{ id = "phase8"; files = @("src/foo.ts","src/bar.ts") } | ConvertTo-Json
 *      Invoke-RestMethod -Uri http://localhost:${LINT_QUEUE_PORT}/lint -Method POST -ContentType 'application/json' -Body $body
 *   3. Or use the client helper: `scripts/lint-queue-client.ts`
 *
 * The server port is defined in `scripts/lint-queue-config.ts` (the single
 * source of truth shared with the client). To change the port, edit that file
 * or set the `LINT_QUEUE_PORT` environment variable.
 *
 * Environment variables:
 *   - LINT_QUEUE_PORT            Override the listening port (default defined
 *                                 in scripts/lint-queue-config.ts)
 *   - LINT_QUEUE_CONCURRENCY      Override eslint --concurrency (default: 4).
 *                                 Set to `auto` to let eslint pick.
 *   - LINT_QUEUE_TIMEOUT_MS       Override per-request exec timeout in ms
 *                                 (default: 300000 for file-scoped, 1200000
 *                                 for full-repo runs).
 */

import { createServer } from "node:http";
import { PORT } from "@/scripts/lint-queue-config";

/**
 * eslint --concurrency value. Capped to 4 by default to avoid memory/CPU
 * thrash on large repos — override via LINT_QUEUE_CONCURRENCY env var.
 */
const CONCURRENCY = process.env.LINT_QUEUE_CONCURRENCY ?? "4";

/**
 * Default per-request exec timeout. Full-repo lints take much longer than
 * file-scoped lints because eslint has to walk the entire project tree, so
 * the timeout is chosen based on request scope.
 */
const DEFAULT_TIMEOUT_FILES_MS = Number(process.env.LINT_QUEUE_TIMEOUT_MS ?? 300000);
const DEFAULT_TIMEOUT_FULL_REPO_MS = Number(
  process.env.LINT_QUEUE_TIMEOUT_MS ?? 1200000
  // 20 minutes for full-repo — eslint over the whole siraj codebase can take
  // 5+ minutes even with a warm cache.
);

/** FIFO queue of pending lint requests. Each entry holds the file list and a Promise resolver. */
const queue: { id: string; files: string[]; resolve: (result: LintResult) => void }[] = [];

/** Whether a lint process is currently executing. Prevents concurrent runs. */
let running = false;

/** Shape of the lint execution result returned to callers. */
type LintResult = { success: boolean; output: string; exitCode: number };

/**
 * Executes eslint (report-only, no auto-fix) scoped to the given files via the
 * local eslint binary.
 *
 * NOTE: `package.json`'s `lint` script is a thin wrapper around
 * `requestFullRepoLint` from `scripts/lint-queue-client.ts`, so `bun run lint`
 * is safe to invoke directly — it submits to this queue server. This server is
 * the SINGLE legitimate direct caller of the eslint binary in the repo, so it
 * invokes eslint directly. `--fix` is intentionally omitted: this server is
 * for reporting issues only; callers that need auto-fix should run
 * `bun run lint:fix` (which bypasses the queue).
 *
 * @param files - List of file paths to lint. When empty, eslint is invoked with
 *                no file args, which makes it lint the whole repo via the
 *                `files`/`ignores` block in eslint.config.js — the only fully
 *                ignore-honoring way to do a full-repo lint.
 * @returns LintResult with success flag, combined stdout+stderr, and exit code
 */
async function runLint(files: string[]): Promise<LintResult> {
  const { exec } = await import("node:child_process");
  const isFullRepo = files.length === 0;
  // For full-repo runs, omit file args entirely so eslint uses its config's
  // files/ignores block as the source of truth. Passing `"."` as a literal arg
  // applies ignore patterns but interacts poorly with cache + walking and can
  // pull in files config would otherwise exclude.
  const fileArgs = isFullRepo ? "" : files.map(f => `"${f}"`).join(" ");
  const cmd =
    `NODE_OPTIONS="-r ./scripts/ts6-eslint-patch.cjs" ~/.bun/bin/bun x eslint --cache --cache-location .eslintcache --concurrency=${CONCURRENCY} ${fileArgs}`.trim();
  const timeout = isFullRepo ? DEFAULT_TIMEOUT_FULL_REPO_MS : DEFAULT_TIMEOUT_FILES_MS;
  return new Promise<LintResult>(resolve => {
    exec(
      cmd,
      {
        cwd: process.cwd(),
        shell: "bash",
        timeout,
        maxBuffer: 50 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const output = (stdout || "") + (stderr || "");
        const exitCode = error ? (error.code ?? 1) : 0;
        resolve({ success: exitCode === 0, output, exitCode: exitCode as number });
      }
    );
  });
}

/**
 * Processes the next item in the queue if no lint is currently running.
 * Called after every enqueue and after each lint completion to drain the queue.
 */
async function processQueue() {
  if (running || queue.length === 0) return;
  running = true;
  const item = queue.shift();
  if (!item) {
    running = false;
    return;
  }
  const scope = item.files.length === 0 ? "full-repo" : `${item.files.length} file(s)`;
  console.log(`[lint-queue] Running lint for request ${item.id} on ${scope} (concurrency=${CONCURRENCY})`);
  try {
    const result = await runLint(item.files);
    item.resolve(result);
  } catch (err) {
    item.resolve({ success: false, output: String(err), exitCode: 1 });
  }
  running = false;
  console.log(`[lint-queue] Completed request ${item.id}`);
  processQueue();
}

/* ─── HTTP Server ──────────────────────────────────────────────────────────── */

const server = createServer((req, res) => {
  /** POST /lint — Enqueue a lint request. Response is sent only after lint completes. */
  if (req.method === "POST" && req.url === "/lint") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        const id = parsed?.id;
        // `files` is optional: omitted/empty means lint the whole repo via
        // eslint config's files/ignores block (no file args passed to eslint).
        const files: string[] = Array.isArray(parsed?.files) ? parsed.files : [];
        if (!id) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing id" }));
          return;
        }
        const promise = new Promise<LintResult>(resolve => {
          queue.push({ id, files, resolve });
        });
        processQueue();
        promise.then(result => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        });
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else if (req.method === "GET" && req.url === "/status") {
    /** GET /status — Returns current queue health: { running, queueLength } */
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ running, queueLength: queue.length }));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`[lint-queue] Server listening on http://localhost:${PORT} (concurrency=${CONCURRENCY})`);
});
