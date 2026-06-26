import { createServer } from "node:http";

const PORT = 4777;
const queue: { id: string; files: string[]; resolve: (result: LintResult) => void }[] = [];
let running = false;

type LintResult = { success: boolean; output: string; exitCode: number };

async function runLint(files: string[]): Promise<LintResult> {
  const { exec } = await import("node:child_process");
  const fileArgs = files.map(f => `"${f}"`).join(" ");
  const cmd = `~/.bun/bin/bun run lint --fix ${fileArgs}`;
  return new Promise<LintResult>(resolve => {
    exec(
      cmd,
      { cwd: "C:\\Users\\PC\\Projects\\siraj", shell: "powershell.exe", timeout: 300000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const output = (stdout || "") + (stderr || "");
        const exitCode = error ? (error.code ?? 1) : 0;
        resolve({ success: exitCode === 0, output, exitCode: exitCode as number });
      }
    );
  });
}

async function processQueue() {
  if (running || queue.length === 0) return;
  running = true;
  const item = queue.shift()!;
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

const server = createServer((req, res) => {
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
