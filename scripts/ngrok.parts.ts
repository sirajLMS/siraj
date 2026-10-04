import {
  BOLD,
  CYAN,
  GRAY,
  GREEN,
  NGROK_INSTALL_HINT_LINUX,
  NGROK_INSTALL_HINT_MACOS,
  NGROK_INSTALL_HINT_URL,
  RESET,
  YELLOW,
} from "@/scripts/ngrok.constants";
import { type CliOptions, isRecord, log, logError } from "@/scripts/ngrok.helpers";

// ── Health Check for Dev Server ─────────────────────────────────────────────

type LocalProtocol = "http" | "https" | null;

/**
 * Probe one protocol against the local webhook endpoint. The HTTPS probe
 * accepts the self-signed localhost certificate Next.js `--experimental-https`
 * generates (Bun fetch `tls` option).
 */
export async function probeLocalEndpoint(protocol: "http" | "https", port: number): Promise<boolean> {
  try {
    const res = await fetch(`${protocol}://localhost:${port}/api/webhooks/whatsapp`, {
      method: "GET",
      signal: AbortSignal.timeout(1000),
      ...(protocol === "https" ? { tls: { rejectUnauthorized: false } } : {}),
    });
    return res.status !== 0;
  } catch {
    return false;
  }
}

/**
 * Probe-then-forward: detect which protocol the local dev server actually
 * speaks. `dev:https` serves TLS on its port while `dev` serves plain HTTP —
 * forwarding the wrong protocol makes every Meta webhook POST fail at the
 * TLS handshake (ngrok inspection shows status 0) before our code ever runs.
 */
export async function detectLocalProtocol(port: number): Promise<LocalProtocol> {
  if (await probeLocalEndpoint("http", port)) return "http";
  if (await probeLocalEndpoint("https", port)) return "https";
  return null;
}

// ── Process Startup ─────────────────────────────────────────────────────────

export async function verifyNgrokCliAvailable(): Promise<void> {
  const whichProc = Bun.spawn(["which", "ngrok"], { stdout: "pipe", stderr: "pipe" });
  const whichCode = await whichProc.exited;
  if (whichCode !== 0) {
    logNgrokCliMissing();
    process.exit(1);
  }
}

export function buildNgrokCommandArgs(options: CliOptions, localProtocol: LocalProtocol): string[] {
  const forwardTarget = localProtocol === "https" ? `https://localhost:${options.port}` : String(options.port);
  const ngrokArgs = ["ngrok", "http", forwardTarget, "--log", "stdout", "--log-format", "json"];

  if (localProtocol === "https") {
    // Next.js --experimental-https generates a self-signed localhost cert, so
    // the upstream TLS verification must be disabled.
    ngrokArgs.push("--upstream-tls-verify=false");
  }

  if (options.authtoken) {
    ngrokArgs.push("--authtoken", options.authtoken);
  }
  if (options.domain) {
    ngrokArgs.push("--url", options.domain.startsWith("http") ? options.domain : `https://${options.domain}`);
  }

  return ngrokArgs;
}

export function registerSignalHandlers(child: { kill: () => unknown }): void {
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
}

// ── Stream Handling ─────────────────────────────────────────────────────────

interface NgrokStreamState {
  tunnelUrl: string | null;
  webAddr: string | null;
  hasReported: boolean;
}

export function createStreamState(): NgrokStreamState {
  return { tunnelUrl: null, webAddr: null, hasReported: false };
}

function extractErrorMessage(record: Record<string, unknown>): string {
  if (typeof record.err === "string") return record.err;
  if (typeof record.msg === "string") return record.msg;
  if (record.err && typeof record.err === "object") return JSON.stringify(record.err);
  return "";
}

function logNgrokCliMissing(): void {
  logError("Error: 'ngrok' command not found in PATH.");
  log("\nTo install ngrok:");
  log(NGROK_INSTALL_HINT_LINUX);
  log(NGROK_INSTALL_HINT_MACOS);
  log(NGROK_INSTALL_HINT_URL);
}

function reportTunnelOnline(
  state: NgrokStreamState,
  url: string,
  inspectAddr: string | null,
  options: CliOptions,
  localProtocol: LocalProtocol
): void {
  if (state.hasReported) return;
  state.hasReported = true;

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "(not set in .env)";
  const callbackUrl = `${url}/api/webhooks/whatsapp`;
  const serverRunning = localProtocol !== null;

  log("\n" + "═".repeat(70));
  log(`${BOLD}${GREEN}  NGROK TUNNEL ONLINE${RESET}`);
  log("═".repeat(70));
  log(
    `  ${BOLD}Forwarding:${RESET}        ${CYAN}${url}${RESET}  ->  ${localProtocol ?? "http"}://localhost:${options.port}`
  );
  if (inspectAddr) {
    log(`  ${BOLD}Web Inspection:${RESET}    http://${inspectAddr}`);
  }
  log("─".repeat(70));
  log(`  ${BOLD}Meta Webhook Settings:${RESET}`);
  log(`  • ${BOLD}Callback URL:${RESET}     ${GREEN}${callbackUrl}${RESET}`);
  log(`  • ${BOLD}Verify token:${RESET}     ${GREEN}${verifyToken}${RESET}`);
  log("═".repeat(70));

  if (!serverRunning) {
    log(`\n${YELLOW}${BOLD}[NOTICE]${RESET} Local server not responding on http(s)://localhost:${options.port}.`);
    log(`         Make sure you start the Next.js dev server in another terminal:`);
    log(`         ${CYAN}bun run dev${RESET} or ${CYAN}bun run dev:https${RESET}\n`);
  } else {
    log(`\n${GREEN}✓ Local server detected on port ${options.port} (${localProtocol?.toUpperCase()}).${RESET}\n`);
  }

  log(`${GRAY}Press Ctrl+C to stop the tunnel.${RESET}\n`);
}

function logNgrokErrorLine(parsed: Record<string, unknown>): void {
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

export function createNgrokLineHandler(
  state: NgrokStreamState,
  options: CliOptions,
  localProtocol: LocalProtocol
): (line: string) => void {
  return (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!isRecord(parsed)) return;

      if (parsed.obj === "web" && typeof parsed.addr === "string") {
        state.webAddr = parsed.addr;
      }

      if (parsed.msg === "started tunnel" && typeof parsed.url === "string") {
        state.tunnelUrl = parsed.url;
        reportTunnelOnline(state, state.tunnelUrl, state.webAddr, options, localProtocol);
      }

      if (parsed.lvl === "eror" || parsed.lvl === "crit") {
        logNgrokErrorLine(parsed);
      }
    } catch {
      if (trimmed.startsWith("ERROR:")) {
        logError(trimmed);
      }
    }
  };
}

export function readNgrokStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handleLine: (line: string) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  const readNext = async (): Promise<void> => {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      handleLine(line);
    }
    return readNext();
  };

  return readNext();
}
