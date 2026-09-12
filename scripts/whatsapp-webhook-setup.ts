#!/usr/bin/env bun
/**
 * One-command Meta webhook configuration for WhatsApp inbound messages.
 *
 * Points the Meta App's webhook subscription at the public callback URL of your
 * local (tunneled) dev server and attaches the WhatsApp Business Account (WABA),
 * replacing the manual Meta App Dashboard steps.
 *
 * Usage:
 *   bun run whatsapp:webhook-setup                         # auto-detect ngrok tunnel, then configure
 *   bun run whatsapp:webhook-setup --url https://x.ngrok-free.dev
 *   bun run whatsapp:webhook-setup --check                 # read-only status, no changes
 */

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

// ── CLI & Env ───────────────────────────────────────────────────────────────

const WEBHOOK_FIELDS = ["messages", "message_template_status_update", "phone_number_quality_update", "account_update"];

interface CliOptions {
  url: string | null;
  check: boolean;
}

interface WhatsappEnv {
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

function parseArgs(argv: readonly string[]): CliOptions {
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

function requireEnv(): WhatsappEnv {
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

async function resolveBaseUrl(cliUrl: string | null): Promise<string> {
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

// ── Graph API Helpers ───────────────────────────────────────────────────────

interface GraphErrorInfo {
  code: number;
  message: string;
}

class GraphApiError extends Error {
  readonly graphError: GraphErrorInfo;

  constructor(info: GraphErrorInfo) {
    super(`Graph API error ${info.code}: ${info.message}`);
    this.graphError = info;
  }
}

interface GraphCallOptions {
  env: WhatsappEnv;
  path: string;
  token: string;
  method?: "GET" | "POST";
  form?: Record<string, string>;
}

async function graphCall({ env, path, token, method = "GET", form }: GraphCallOptions): Promise<unknown> {
  const url = `https://graph.facebook.com/${env.apiVersion}/${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(form ? { body: new URLSearchParams(form).toString() } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    throw new Error(`Network error calling Graph API: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }

  const body: unknown = await res.json().catch(() => null);
  if (isRecord(body) && isRecord(body.error)) {
    const code = typeof body.error.code === "number" ? body.error.code : res.status;
    const message = typeof body.error.message === "string" ? body.error.message : "Unknown Graph API error";
    throw new GraphApiError({ code, message });
  }
  if (!res.ok) {
    throw new GraphApiError({ code: res.status, message: `HTTP ${res.status} ${res.statusText}` });
  }
  return body;
}

function printGraphError(err: unknown): void {
  if (err instanceof GraphApiError) {
    logError(`Graph API error ${err.graphError.code}: ${err.graphError.message}`);
  } else {
    logError(err instanceof Error ? err.message : String(err));
  }
}

// ── Subscription Inspection ─────────────────────────────────────────────────

interface AppSubscription {
  callbackUrl: string | null;
  fields: string[];
}

function extractSubscription(body: unknown): AppSubscription | null {
  if (!isRecord(body) || !Array.isArray(body.data)) return null;
  for (const entry of body.data) {
    if (isRecord(entry) && entry.object === "whatsapp_business_account") {
      return {
        callbackUrl: typeof entry.callback_url === "string" ? entry.callback_url : null,
        fields: Array.isArray(entry.fields)
          ? entry.fields
              .filter((f): f is Record<string, unknown> => isRecord(f))
              .map(f => (typeof f.name === "string" ? f.name : ""))
              .filter(Boolean)
          : [],
      };
    }
  }
  return null;
}

async function getAppSubscription(env: WhatsappEnv): Promise<AppSubscription | null> {
  const body = await graphCall({
    env,
    path: `${env.appId}/subscriptions`,
    token: `${env.appId}|${env.appSecret}`,
  });
  return extractSubscription(body);
}

async function getWabaAttached(env: WhatsappEnv): Promise<boolean> {
  const body = await graphCall({
    env,
    path: `${env.wabaId}/subscribed_apps`,
    token: env.accessToken,
  });
  return isRecord(body) && Array.isArray(body.data) && body.data.length > 0;
}

// ── Modes ───────────────────────────────────────────────────────────────────

async function runCheck(env: WhatsappEnv): Promise<void> {
  log(`\n${BOLD}Webhook configuration status${RESET} ${GRAY}(read-only, Graph API ${env.apiVersion})${RESET}`);
  log("─".repeat(70));

  const [subscription, wabaAttached] = await Promise.all([getAppSubscription(env), getWabaAttached(env)]);

  log(`  ${BOLD}Callback URL:${RESET}     ${CYAN}${subscription?.callbackUrl ?? "NONE"}${RESET}`);
  if (subscription) {
    log(
      `  ${BOLD}Fields:${RESET}           ${subscription.fields.length > 0 ? subscription.fields.join(", ") : "(none)"}`
    );
  } else {
    log(`  ${BOLD}Fields:${RESET}           ${GRAY}(no whatsapp_business_account subscription)${RESET}`);
  }
  const wabaStatus = wabaAttached ? `${GREEN}yes${RESET} (app subscribed to WABA)` : `${YELLOW}no${RESET}`;
  log(`  ${BOLD}WABA attached:${RESET}    ${wabaStatus}`);
  log("─".repeat(70) + "\n");
}

function isAlreadySubscribedError(err: unknown): boolean {
  return err instanceof GraphApiError && /already (subscribed|connected)/i.test(err.graphError.message);
}

async function runSetup(env: WhatsappEnv, baseUrl: string): Promise<void> {
  const callbackUrl = `${baseUrl}/api/webhooks/whatsapp`;

  // 1. Ensure the app-level webhook subscription exists and points at callbackUrl
  const existing = await getAppSubscription(env).catch((err: unknown) => {
    printGraphError(err);
    process.exit(1);
  });

  if (existing) {
    if (existing.callbackUrl === callbackUrl) {
      log(`${GREEN}✓ App subscription already points at this callback URL; refreshing it anyway.${RESET}`);
    } else {
      log(
        `${YELLOW}App subscription exists with a different callback URL (${existing.callbackUrl ?? "NONE"}); updating it.${RESET}`
      );
    }
  } else {
    log(`${GRAY}No whatsapp_business_account subscription found; creating one.${RESET}`);
  }

  await graphCall({
    env,
    path: `${env.appId}/subscriptions`,
    token: `${env.appId}|${env.appSecret}`,
    method: "POST",
    form: {
      object: "whatsapp_business_account",
      callback_url: callbackUrl,
      verify_token: env.verifyToken,
      fields: WEBHOOK_FIELDS.join(","),
      include_values: "true",
    },
  }).catch((err: unknown) => {
    printGraphError(err);
    process.exit(1);
  });
  log(`${GREEN}✓ Webhook subscription configured.${RESET}`);

  // 2. Attach the WABA to this app
  try {
    await graphCall({
      env,
      path: `${env.wabaId}/subscribed_apps`,
      token: env.accessToken,
      method: "POST",
    });
    log(`${GREEN}✓ WABA attached to app.${RESET}`);
  } catch (err) {
    if (isAlreadySubscribedError(err)) {
      log(`${GREEN}✓ WABA already subscribed to this app.${RESET}`);
    } else {
      printGraphError(err);
      process.exit(1);
    }
  }

  // 3. Summary
  log("\n" + "═".repeat(70));
  log(`${BOLD}${GREEN}  WHATSAPP WEBHOOKS CONFIGURED${RESET}`);
  log("═".repeat(70));
  log(`  ${BOLD}Callback URL:${RESET}  ${CYAN}${callbackUrl}${RESET}`);
  log(`  ${BOLD}Fields:${RESET}        ${WEBHOOK_FIELDS.join(", ")}`);
  log(`  ${BOLD}WABA attached:${RESET} ${GREEN}yes${RESET}`);
  log("═".repeat(70));
  log(`\n${BOLD}Next:${RESET} send a WhatsApp message to your number to test.\n`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const env = requireEnv();

  if (options.check) {
    await runCheck(env);
    return;
  }

  const baseUrl = await resolveBaseUrl(options.url);
  await runSetup(env, baseUrl);
}

await main();
