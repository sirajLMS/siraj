import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { log } from "@/scripts/__shared__";
import { BOLD, RESET } from "@/scripts/ngrok.constants";

// Re-exported for consumers importing these CLI helpers from this module.
export * from "./__shared__/cli-output.helpers";

export interface CliOptions {
  port: number;
  domain: string | null;
  authtoken: string | null;
  envFile: string;
}

interface PreArgvConfig {
  envFile: string;
  fromOmniroute: boolean;
}

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

export function parseArgs(argv: readonly string[]): CliOptions {
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
