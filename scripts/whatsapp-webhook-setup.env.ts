import { BOLD, log, logError, RESET } from "@/scripts/whatsapp-webhook-setup.helpers";

export interface CliOptions {
  url: string | null;
  check: boolean;
}

export interface WhatsappEnv {
  appId: string;
  appSecret: string;
  accessToken: string;
  verifyToken: string;
  wabaId: string;
  apiVersion: string;
}

function printHelp(): void {
  log(`
${BOLD}WhatsApp Webhook Setup${RESET}

Configures the Meta App webhook subscription and WABA attachment via the Graph API.

${BOLD}Usage:${RESET}
  bun run whatsapp:webhook-setup [options]

${BOLD}Options:${RESET}
  --url <https://...>   Public base URL of your server (skips ngrok auto-detection)
  --check               Read-only: print current subscription status, change nothing
  -h, --help            Show this help message

${BOLD}Examples:${RESET}
  bun run whatsapp:webhook-setup                          # detect tunnel, configure webhooks
  bun run whatsapp:webhook-setup --url https://x.ngrok-free.dev
  bun run whatsapp:webhook-setup --check                  # inspect current configuration
`);
}

export function parseArgs(argv: readonly string[]): CliOptions {
  let url: string | null = null;
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--check") {
      check = true;
    } else if (arg === "--url" && typeof argv[i + 1] === "string") {
      url = argv[i + 1] ?? null;
      i++;
    }
  }
  return { url, check };
}

function requirePresent(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function normalizeApiVersion(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

export function requireEnv(): WhatsappEnv {
  const appId = process.env.WHATSAPP_APP_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const wabaId = process.env.WHATSAPP_WABA_ID;

  const missing: string[] = [];
  if (!appId) missing.push("WHATSAPP_APP_ID");
  if (!appSecret) missing.push("WHATSAPP_APP_SECRET");
  if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
  if (!verifyToken) missing.push("WHATSAPP_VERIFY_TOKEN");
  if (!wabaId) missing.push("WHATSAPP_WABA_ID");

  if (missing.length > 0) {
    logError(`Missing required .env variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const apiVersion = normalizeApiVersion(
    process.env.WHATSAPP_GRAPH_API_VERSION ?? process.env.WHATSAPP_API_VERSION ?? "v26.0"
  );

  return {
    appId: requirePresent(appId, "WHATSAPP_APP_ID"),
    appSecret: requirePresent(appSecret, "WHATSAPP_APP_SECRET"),
    accessToken: requirePresent(accessToken, "WHATSAPP_ACCESS_TOKEN"),
    verifyToken: requirePresent(verifyToken, "WHATSAPP_VERIFY_TOKEN"),
    wabaId: requirePresent(wabaId, "WHATSAPP_WABA_ID"),
    apiVersion,
  };
}
