import { CYAN, GRAY, GREEN, isRecord, log, logError, RESET } from "@/scripts/whatsapp-webhook-setup.helpers";

// ── Tunnel Auto-Detection ───────────────────────────────────────────────────

async function fetchTunnelUrl(port: number): Promise<string | null> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tunnels`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (!isRecord(body) || !Array.isArray(body.tunnels)) return null;
    for (const tunnel of body.tunnels) {
      if (isRecord(tunnel) && typeof tunnel.public_url === "string" && tunnel.public_url.startsWith("https://")) {
        return tunnel.public_url;
      }
    }
  } catch {
    // Inspector not reachable on this port
  }
  return null;
}

async function detectTunnelUrl(): Promise<string | null> {
  const results = await Promise.all([4040, 4041].map(port => fetchTunnelUrl(port)));
  return results.find(url => url !== null) ?? null;
}

function stripTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === "/") end--;
  return url.slice(0, end);
}

export async function resolveBaseUrl(cliUrl: string | null): Promise<string> {
  if (cliUrl) {
    if (!cliUrl.startsWith("https://")) {
      logError(`--url must be an https:// URL, got: ${cliUrl}`);
      process.exit(1);
    }
    return stripTrailingSlashes(cliUrl);
  }

  log(`${GRAY}Looking for a running ngrok tunnel (127.0.0.1:4040, 127.0.0.1:4041)...${RESET}`);
  const detected = await detectTunnelUrl();
  if (detected) {
    log(`${GREEN}✓ Found tunnel:${RESET} ${CYAN}${detected}${RESET}`);
    return stripTrailingSlashes(detected);
  }

  logError("No HTTPS tunnel detected.");
  log("\nNext steps:");
  log(`  1. Start a tunnel in another terminal:  ${CYAN}bun run ngrok${RESET}`);
  log(`  2. Re-run this command, or pass the URL directly:`);
  log(`       ${CYAN}bun run whatsapp:webhook-setup --url https://<your-domain>${RESET}\n`);
  return process.exit(1);
}
