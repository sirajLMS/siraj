/**
 * Lint Queue Server — Serialized ESLint Execution for Concurrent Sub-Agents
 *
 * When multiple AI sub-agents run in parallel, each calling `bun run lint`
 * simultaneously causes severe resource contention and intermittent failures.
 * This HTTP server serializes lint requests so only one `bun lint` process
 * runs at a time, while all callers wait for their turn and receive results.
 *
 * Architecture:
 *   - Single-threaded FIFO queue backed by a `running` flag
 *   - POST /lint  → Enqueue a lint request; blocks until the result is ready
 *   - GET  /status → Returns `{ running, queueLength }` for health checks
 *
 * Request body (POST /lint):
 *   { id: string, files: string[] }
 *   - `id`      — Arbitrary caller identifier (used for log correlation)
 *   - `files`   — Array of file paths to pass to `bun run lint --fix`
 *
 * Response body (POST /lint):
 *   { success: boolean, output: string, exitCode: number }
 *
 * Usage:
 *   1. Start the server:  `~/.bun/bin/bun run scripts/lint-queue-server.ts`
 *   2. From any sub-agent or shell:
 *      $body = @{ id = "phase8"; files = @("src/foo.ts","src/bar.ts") } | ConvertTo-Json
 *      Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
 *   3. Or use the client helper: `scripts/lint-queue-client.ts`
 *
 * The server listens on port 4777 by default (const PORT below).
 */

import { createServer } from "node:http";

/** TCP port the lint queue server listens on. */
const PORT = 4777;

/** FIFO queue of pending lint requests. Each entry holds the file list and a Promise resolver. */
const queue: { id: string; files: string[]; resolve: (result: LintResult) => void }[] = [];

/** Whether a lint process is currently executing. Prevents concurrent runs. */
let running = false;

/** Shape of the lint execution result returned to callers. */
type LintResult = { success: boolean; output: string; exitCode: number };

/**
 * Executes `bun run lint --fix` scoped to the given files.
 *
 * @param files - List of file paths to lint (passed as trailing CLI args)
 * @returns LintResult with success flag, combined stdout+stderr, and exit code
 */
async function runLint(files: string[]): Promise<LintResult> {
  const { exec } = await import("node:child_process");
  const fileArgs = files.map(f => `"${f}"`).join(" ");
  const cmd = `~/.bun/bin/bun run lint --fix ${fileArgs}`;
  return new Promise<LintResult>(resolve => {
    exec(
      cmd,
      {
        cwd: process.cwd(),
        shell: "bash",
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
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
  console.log(`[lint-queue] Running lint for request ${item.id} on ${item.files.length} file(s)`);
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
        const { id, files } = JSON.parse(body);
        if (!id || !Array.isArray(files)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing id or files" }));
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
  console.log(`[lint-queue] Server listening on http://localhost:${PORT}`);
});
