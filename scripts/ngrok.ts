#!/usr/bin/env bun
/**
 * Ngrok tunnel launcher for local WhatsApp webhook development.
 *
 * This script starts an ngrok HTTP tunnel forwarding to your local Next.js dev server,
 * extracts the public HTTPS endpoint, and prints the exact Callback URL and Verify Token
 * required by Meta Developer Console.
 *
 * Usage:
 *   bun run ngrok                              # default: reads .env / system ngrok config, port 3000
 *   bun run ngrok --port 3000                  # custom port
 *   bun run ngrok --domain my-domain.dev       # custom or reserved ngrok domain
 *   bun run ngrok --authtoken <token>          # explicit authtoken
 *   bun run ngrok --from-omniroute             # use authtoken & domain from ~/.omniroute/.env
 *   bun run ngrok --env-file .env.local        # custom env file
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

interface CliOptions {
  port: number;
  domain: string | null;
  authtoken: string | null;
  envFile: string;
}

// ── Colors for CLI Output ───────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";

function log(msg: string): void {
  console.log(msg);
}

function logError(msg: string): void {
  console.error(`${RED}${msg}${RESET}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ── Helper to read key-values from a file ────────────────────────────────────

function readEnvFileValues(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!existsSync(filePath)) return result;
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  } catch {
    // Ignore read errors
  }
  return result;
}

// ── Parse Arguments ─────────────────────────────────────────────────────────

interface PreArgvConfig {
  envFile: string;
  fromOmniroute: boolean;
}

function extractPreArgvConfig(argv: readonly string[]): PreArgvConfig {
  let envFile = ".env";
  let fromOmniroute = false;

  for (let i = 0; i < argv.length; i++) {
    const nextArg = argv[i + 1];
    if (argv[i] === "--env-file" && typeof nextArg === "string") {
      envFile = nextArg;
    } else if (argv[i] === "--from-omniroute") {
      fromOmniroute = true;
    }
  }

  return { envFile, fromOmniroute };
}

function resolveOmnirouteDefaults(): { authtoken: string | null; domain: string | null } {
  const omnirouteEnv = readEnvFileValues(resolve(homedir(), ".omniroute", ".env"));
  return {
    authtoken: omnirouteEnv.NGROK_AUTHTOKEN ?? null,
    domain: omnirouteEnv.NGROK_DOMAIN ?? null,
  };
}

function applyCliArg(
  arg: string,
  nextVal: string | undefined,
  current: CliOptions
): { advance: boolean; options: CliOptions } {
  if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  }
  if ((arg === "--port" || arg === "-p") && typeof nextVal === "string") {
    return { advance: true, options: { ...current, port: Number.parseInt(nextVal, 10) } };
  }
  if (arg === "--domain" && typeof nextVal === "string") {
    return { advance: true, options: { ...current, domain: nextVal } };
  }
  if (arg === "--authtoken" && typeof nextVal === "string") {
    return { advance: true, options: { ...current, authtoken: nextVal } };
  }
  if (!arg.startsWith("-") && /^\d+$/.test(arg)) {
    return { advance: false, options: { ...current, port: Number.parseInt(arg, 10) } };
  }
  return { advance: false, options: current };
}

function parseArgs(argv: readonly string[]): CliOptions {
  const { envFile, fromOmniroute } = extractPreArgvConfig(argv);
  loadEnv({ path: resolve(process.cwd(), envFile) });

  let options: CliOptions = {
    port: Number.parseInt(process.env.NGROK_PORT ?? "3000", 10),
    domain: process.env.NGROK_DOMAIN ?? null,
    authtoken: process.env.NGROK_AUTHTOKEN ?? null,
    envFile,
  };

  if (fromOmniroute) {
    const omniroute = resolveOmnirouteDefaults();
    if (omniroute.authtoken) options.authtoken = omniroute.authtoken;
    if (omniroute.domain) options.domain = omniroute.domain;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;
    const { advance, options: updated } = applyCliArg(arg, argv[i + 1], options);
    options = updated;
    if (advance) i++;
  }

  return options;
}

function printHelp(): void {
  log(`
${BOLD}Siraj Ngrok Development Tunnel${RESET}

Starts an ngrok HTTP tunnel and formats Meta Webhook Callback details.

${BOLD}Usage:${RESET}
  bun run ngrok [options] [port]

${BOLD}Options:${RESET}
  -p, --port <number>       Local port to forward traffic to (default: 3000 or NGROK_PORT)
  --domain <domain>         Custom or reserved ngrok domain (or NGROK_DOMAIN)
  --authtoken <token>       Ngrok authtoken (or NGROK_AUTHTOKEN)
  --from-omniroute          Load NGROK_AUTHTOKEN and NGROK_DOMAIN from ~/.omniroute/.env
  --env-file <file>         Environment file to read (default: .env)
  -h, --help                Show this help message

${BOLD}Examples:${RESET}
  bun run ngrok                                            # uses system/env credentials
  bun run ngrok 3000                                       # forward to port 3000
  bun run ngrok --domain my-domain.ngrok-free.dev          # custom domain
  bun run ngrok --from-omniroute                           # use omniroute's reserved tunnel
`);
}

// ── Health Check for Dev Server ─────────────────────────────────────────────

async function checkLocalServer(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/api/webhooks/whatsapp`, {
      method: "GET",
      signal: AbortSignal.timeout(1000),
    });
    return res.status !== 0;
  } catch {
    return false;
  }
}

// ── Extract error message from log record ───────────────────────────────────

function extractErrorMessage(record: Record<string, unknown>): string {
  if (typeof record.err === "string") return record.err;
  if (typeof record.msg === "string") return record.msg;
  if (record.err && typeof record.err === "object") return JSON.stringify(record.err);
  return "";
}

// ── Main Execution ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  // 1. Verify ngrok CLI availability
  const whichProc = Bun.spawn(["which", "ngrok"], { stdout: "pipe", stderr: "pipe" });
  const whichCode = await whichProc.exited;
  if (whichCode !== 0) {
    logError("Error: 'ngrok' command not found in PATH.");
    log("\nTo install ngrok:");
    log(
      "  Linux (apt): curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok"
    );
    log("  macOS:       brew install ngrok");
    log("  Or visit:    https://ngrok.com/download\n");
    process.exit(1);
  }

  // 2. Build ngrok command
  const ngrokArgs = ["ngrok", "http", String(options.port), "--log", "stdout", "--log-format", "json"];

  if (options.authtoken) {
    ngrokArgs.push("--authtoken", options.authtoken);
  }
  if (options.domain) {
    ngrokArgs.push("--url", options.domain.startsWith("http") ? options.domain : `https://${options.domain}`);
  }

  log(`${GRAY}Starting ngrok tunnel for port ${options.port}...${RESET}`);

  // 3. Spawn ngrok process
  const child = Bun.spawn(ngrokArgs, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "inherit",
  });

  let tunnelUrl: string | null = null;
  let webAddr: string | null = null;
  let hasReported = false;

  const cleanup = () => {
    try {
      child.kill();
    } catch {
      // Ignore if already exited
    }
  };

  process.on("SIGINT", () => {
    log(`\n${YELLOW}Stopping ngrok tunnel...${RESET}`);
    cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  // 4. Stream stdout JSON lines
  const reader = child.stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const reportDashboard = async (url: string, inspectAddr: string | null) => {
    if (hasReported) return;
    hasReported = true;

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "(not set in .env)";
    const callbackUrl = `${url}/api/webhooks/whatsapp`;
    const serverRunning = await checkLocalServer(options.port);

    log("\n" + "═".repeat(70));
    log(`${BOLD}${GREEN}  NGROK TUNNEL ONLINE${RESET}`);
    log("═".repeat(70));
    log(`  ${BOLD}Forwarding:${RESET}        ${CYAN}${url}${RESET}  ->  http://localhost:${options.port}`);
    if (inspectAddr) {
      log(`  ${BOLD}Web Inspection:${RESET}    http://${inspectAddr}`);
    }
    log("─".repeat(70));
    log(`  ${BOLD}Meta Webhook Settings:${RESET}`);
    log(`  • ${BOLD}Callback URL:${RESET}     ${GREEN}${callbackUrl}${RESET}`);
    log(`  • ${BOLD}Verify token:${RESET}     ${GREEN}${verifyToken}${RESET}`);
    log("═".repeat(70));

    if (!serverRunning) {
      log(`\n${YELLOW}${BOLD}[NOTICE]${RESET} Local server not responding on http://localhost:${options.port}.`);
      log(`         Make sure you start the Next.js dev server in another terminal:`);
      log(`         ${CYAN}bun run dev${RESET}\n`);
    } else {
      log(`\n${GREEN}✓ Local server detected on port ${options.port}.${RESET}\n`);
    }

    log(`${GRAY}Press Ctrl+C to stop the tunnel.${RESET}\n`);
  };

  const handleLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!isRecord(parsed)) return;

      if (parsed.obj === "web" && typeof parsed.addr === "string") {
        webAddr = parsed.addr;
      }

      if (parsed.msg === "started tunnel" && typeof parsed.url === "string") {
        tunnelUrl = parsed.url;
        void reportDashboard(tunnelUrl, webAddr);
      }

      if (parsed.lvl === "eror" || parsed.lvl === "crit") {
        const errMsg = extractErrorMessage(parsed);
        if (errMsg.includes("ERR_NGROK_334") || errMsg.includes("already online")) {
          logError("\n[Ngrok Error] The requested endpoint/domain is already online in another session.");
          log(`If OmniRoute is currently using this domain, run ngrok without '--domain':`);
          log(`  ${CYAN}bun run ngrok${RESET} (creates an available HTTPS URL)\n`);
        } else if (errMsg.includes("ERR_NGROK_320") || errMsg.includes("reserved for another account")) {
          logError("\n[Ngrok Error] The domain is reserved for a different ngrok account.");
          log(`Check your NGROK_AUTHTOKEN in .env or run without '--domain'.\n`);
        } else {
          logError(`[Ngrok Error] ${errMsg}`);
        }
      }
    } catch {
      if (trimmed.startsWith("ERROR:")) {
        logError(trimmed);
      }
    }
  };

  const readStreamLoop = async (): Promise<void> => {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      handleLine(line);
    }
    return readStreamLoop();
  };

  void readStreamLoop().catch(() => {
    // Stream closed
  });

  const exitCode = await child.exited;
  if (exitCode !== 0 && !hasReported) {
    process.exit(exitCode);
  }
}

await main();
