import { GraphQLError } from "graphql";

import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { maskSecretValue } from "@/backend/lib";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import type { WhatsappConfigCredentialField } from "@/backend/lib/whatsapp-constants";
import { resolveEnvConfig } from "@/backend/services/system";
import type {
  WhatsappConfigMaskedViewType,
  WhatsappConfigResolvedType,
  WhatsappConfigSource,
  WhatsappConnectionTestResult,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Fixed API path of the inbound Meta webhook route (app/api/webhooks/whatsapp). */
const WHATSAPP_WEBHOOK_PATH = "/api/webhooks/whatsapp";

/** Apollo cache key of the singleton configuration object. */
const WHATSAPP_CONFIGURATION_CACHE_ID = "whatsapp-configuration";

/** Apollo cache key of the one-shot connection-check outcome. */
const WHATSAPP_CONNECTION_TEST_CACHE_ID = "whatsapp-connection-test";

// ─── Webhook URL derivation ──────────────────────────────────────────────────

/**
 * Derives the callback URL Meta must call for inbound webhook events. A
 * deployment can pin the origin through the `WHATSAPP_WEBHOOK_BASE_URL`
 * env-config key (tunnels, reverse proxies); otherwise the server's own base
 * URL is used. A configured value that already carries the webhook path is
 * accepted verbatim so both base-origin and full-URL conventions work.
 */
async function deriveWhatsappWebhookUrl(): Promise<string> {
  const configuredBase = (await resolveEnvConfig("WHATSAPP_WEBHOOK_BASE_URL"))?.trim().replace(/\/+$/, "");
  const base = configuredBase ? configuredBase : NEXT_PUBLIC_BASE_URL;
  return base.endsWith(WHATSAPP_WEBHOOK_PATH) ? base : `${base}${WHATSAPP_WEBHOOK_PATH}`;
}

/**
 * Builds the client-safe view of a credential set. `appSecret` and
 * `accessToken` are masked through the shared masked-tail helper so no
 * plaintext secret crosses the API boundary, while `verifyToken` stays
 * visible (it is shared with Meta's subscription by design). `source` is
 * passed explicitly: a resolved configuration carries its own origin, while
 * a freshly stored row always originates from the database.
 *
 * Works for both the resolved credential set (query path) and the stored
 * entity returned by the save (mutation path).
 */
export async function toWhatsappConfigMaskedView(
  config: Pick<WhatsappConfigResolvedType, WhatsappConfigCredentialField>,
  source: WhatsappConfigSource
): Promise<WhatsappConfigMaskedViewType> {
  return {
    source,
    appId: config.appId,
    appSecret: maskSecretValue(config.appSecret ?? undefined) ?? null,
    verifyToken: config.verifyToken,
    phoneNumberId: config.phoneNumberId,
    wabaId: config.wabaId,
    accessToken: maskSecretValue(config.accessToken ?? undefined) ?? null,
    esConfigId: config.esConfigId,
    webhookUrl: await deriveWhatsappWebhookUrl(),
  };
}

// ─── View permission helpers ─────────────────────────────────────────────────

/**
 * The configuration view is readable by holders of either WhatsApp
 * permission: viewers who render the settings page and managers who edit it.
 * A scope map cannot express "either of two values of the same `permission`
 * scope", so the grant is evaluated against the request context directly —
 * the same pattern the environment-config surface uses for its dual-permission reads.
 */
export function canViewWhatsappConfig(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.WHATSAPP_VIEW) ||
    ctx.permissions.includes(AppPermission.WHATSAPP_CONFIG_MANAGE)
  );
}

export function assertCanViewWhatsappConfig(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewWhatsappConfig(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

// ─── Object Types ────────────────────────────────────────────────────────────

export const WhatsappConfigurationRef =
  gqlSchemaBuilder.objectRef<WhatsappConfigMaskedViewType>("WhatsappConfiguration");

export const WhatsappConfigurationPothosObject = WhatsappConfigurationRef.implement({
  fields: t => ({
    // Apollo cache key: the configuration is a deployment-wide singleton.
    id: t.string({ resolve: () => WHATSAPP_CONFIGURATION_CACHE_ID }),
    source: t.exposeString("source", {
      description:
        "Where the active values come from: the saved database row (`db`) or the WHATSAPP_* environment keys (`env`).",
    }),
    appId: t.exposeString("appId", { nullable: true, description: "Meta app ID." }),
    appSecret: t.exposeString("appSecret", {
      nullable: true,
      description: "Masked Meta app secret (last four characters only) — never returned in plaintext.",
    }),
    verifyToken: t.exposeString("verifyToken", {
      nullable: true,
      description: "Webhook verify token shared with the Meta webhook subscription.",
    }),
    phoneNumberId: t.exposeString("phoneNumberId", { nullable: true, description: "Meta phone number ID." }),
    wabaId: t.exposeString("wabaId", { nullable: true, description: "WhatsApp Business Account ID." }),
    accessToken: t.exposeString("accessToken", {
      nullable: true,
      description: "Masked permanent access token (last four characters only) — never returned in plaintext.",
    }),
    esConfigId: t.exposeString("esConfigId", {
      nullable: true,
      description: "Facebook Login for Business configuration ID used by Embedded Signup.",
    }),
    webhookUrl: t.exposeString("webhookUrl", {
      description: "Callback URL Meta must call for webhook events, derived from the deployment origin.",
    }),
  }),
});

export const WhatsappConnectionTestResultRef =
  gqlSchemaBuilder.objectRef<WhatsappConnectionTestResult>("WhatsappConnectionTestResult");

export const WhatsappConnectionTestResultPothosObject = WhatsappConnectionTestResultRef.implement({
  fields: t => ({
    // Apollo cache key: the result is a one-shot check outcome, not an entity.
    id: t.string({ resolve: () => WHATSAPP_CONNECTION_TEST_CACHE_ID }),
    success: t.exposeBoolean("success", { description: "Whether the live Meta Graph API check succeeded." }),
    message: t.exposeString("message", {
      description: "Localized, user-facing outcome copy — never contains tokens or provider error details.",
    }),
    phoneNumber: t.exposeString("phoneNumber", {
      nullable: true,
      description: "Display phone number Meta returned for the configured phone number ID (successful checks only).",
    }),
  }),
});

// ─── Input Types ─────────────────────────────────────────────────────────────

/**
 * Per-field credential patch. Every field is optional: a provided string is
 * written (merged with the stored row), an explicit `null` clears the stored
 * value, and an omitted field keeps its current value. Secrets are accepted
 * in plaintext and encrypted at the driver boundary; they are never echoed
 * back — the mutation returns the masked view instead.
 */
export const WhatsappConfigUpdateInputPothosObject = gqlSchemaBuilder.inputType("WhatsappConfigUpdateInput", {
  fields: t => ({
    appId: t.string({
      required: false,
      description: "Meta app ID. Pass null to clear.",
      directives: { constraint: { maxLength: 64 } },
    }),
    appSecret: t.string({
      required: false,
      description: "Meta app secret (stored encrypted). Pass null to clear.",
      // 512 mirrors the service-level cap for encrypted fields (the DB column
      // is unbounded ciphertext text); it was previously 255, a verifyToken
      // copy-paste that contradicted the accessToken cap.
      directives: { constraint: { maxLength: 512 } },
    }),
    verifyToken: t.string({
      required: false,
      description: "Webhook verify token. Pass null to clear.",
      directives: { constraint: { maxLength: 255 } },
    }),
    phoneNumberId: t.string({
      required: false,
      description: "Meta phone number ID. Pass null to clear.",
      directives: { constraint: { maxLength: 64 } },
    }),
    wabaId: t.string({
      required: false,
      description: "WhatsApp Business Account ID. Pass null to clear.",
      directives: { constraint: { maxLength: 64 } },
    }),
    accessToken: t.string({
      required: false,
      description: "Permanent access token (stored encrypted). Pass null to clear.",
      directives: { constraint: { maxLength: 512 } },
    }),
    esConfigId: t.string({
      required: false,
      description: "Facebook Login for Business configuration ID. Pass null to clear.",
      directives: { constraint: { maxLength: 64 } },
    }),
  }),
});
