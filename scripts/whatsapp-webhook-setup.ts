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

import { parseArgs, requireEnv, type WhatsappEnv } from "@/scripts/whatsapp-webhook-setup.env";
import {
  getAppSubscription,
  getWabaAttached,
  graphCall,
  isAlreadySubscribedError,
  printGraphError,
} from "@/scripts/whatsapp-webhook-setup.graph";
import { BOLD, CYAN, GRAY, GREEN, log, RESET, YELLOW } from "@/scripts/whatsapp-webhook-setup.helpers";
import { resolveBaseUrl } from "@/scripts/whatsapp-webhook-setup.tunnel";

// ── Webhook Fields ──────────────────────────────────────────────────────────

const WEBHOOK_FIELDS = ["messages", "message_template_status_update", "phone_number_quality_update", "account_update"];

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
