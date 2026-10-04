import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappSyncStatus } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { logger } from "@/backend/lib/logger";
import { resetWhatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { AuditService } from "@/backend/services/system/audit.service";
import { WhatsappAccountService } from "@/backend/services/whatsapp/whatsapp-account.service";
import {
  isRecord,
  resolveLifecycleAccount,
  toSafeString,
} from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { CreateAuditLogInput, WhatsappAccountReturnType } from "@/backend/types";

/**
 * `account_update` lifecycle handling for the WhatsApp webhook handler.
 * Lifecycle payloads are WABA-scoped (`phone_number`/`waba_id`, no
 * `phone_number_id`), so resolution goes through WABA + display-number
 * disambiguation. Every recognized event writes an audit row; dangerous
 * transitions also flip account state and evict the per-account adapter so
 * subsequent sends fail fast before touching Meta.
 *
 * Payloads are untrusted parsed JSON (guard-narrowed, never logged with
 * content); failures log ids and counts only.
 */

/** Sync failure reason when Meta offboards a number mid-sync. */
export const WHATSAPP_SYNC_FAILURE_ACCOUNT_OFFBOARDED = "accountOffboarded";

/** Meta account_update disconnection reasons observed on PARTNER_REMOVED. */
const PARTNER_DISCONNECTION_REASONS = new Set([
  "ACCOUNT_DISCONNECTED",
  "BUSINESS_DOWNGRADE",
  "CHANGE_NUMBER",
  "COMPANION_INACTIVITY",
  "PRIMARY_INACTIVITY",
  "USER_RE_REGISTERED",
]);

/** Extract the PARTNER_REMOVED disconnection reason (null when unlisted). */
function parseDisconnectionReason(value: Record<string, unknown>): string | null {
  const info = isRecord(value.disconnection_info) ? value.disconnection_info : null;
  const reason = info ? toSafeString(info.reason) : undefined;
  return reason && PARTNER_DISCONNECTION_REASONS.has(reason) ? reason : null;
}

/** Extract the WABA ban state for DISABLED_UPDATE. */
function parseBanState(value: Record<string, unknown>): string | null {
  const info = isRecord(value.ban_info) ? value.ban_info : null;
  return info ? (toSafeString(info.waba_ban_state) ?? null) : null;
}

/** ACCOUNT_OFFBOARDED: deactivate + stamp + fail sync + evict the adapter. */
async function applyAccountOffboarded(account: WhatsappAccountReturnType): Promise<void> {
  await WhatsappAccountRepository.markOffboarded(account.id, new Date());
  if (account.syncStatus !== WhatsappSyncStatus.COMPLETE) {
    await WhatsappAccountRepository.markSyncFailed(account.id, WHATSAPP_SYNC_FAILURE_ACCOUNT_OFFBOARDED);
  }
  await resetWhatsappChannel(account.id);
  logger.warn("whatsapp-webhook-handler: account offboarded by Meta — Cloud API sends suspended until reconnect");
}

/** ACCOUNT_RECONNECTED: reactivate + clear marker; adapter re-instantiates lazily. */
async function applyAccountReconnected(account: WhatsappAccountReturnType): Promise<void> {
  await WhatsappAccountRepository.clearOffboarded(account.id);
  await resetWhatsappChannel(account.id);
  logger.warn("whatsapp-webhook-handler: account reconnected — companion devices need manual re-linking");
}

/** PARTNER_APP_UNINSTALLED / PARTNER_REMOVED: keep history, deactivate + evict. */
async function applyAccountDeactivated(account: WhatsappAccountReturnType, event: string): Promise<void> {
  await WhatsappAccountService.systemUpdateAccount(account.id, { isActive: false });
  await resetWhatsappChannel(account.id);
  logger.warn("whatsapp-webhook-handler: partner relationship ended — account deactivated", { event });
}

/** Persist the lifecycle audit row (failures are logged, not rethrown). */
async function writeLifecycleAudit(
  account: WhatsappAccountReturnType,
  event: string,
  value: Record<string, unknown>,
  disconnectionReason: string | null
): Promise<void> {
  const banState = parseBanState(value);
  const verified = typeof value.verified === "boolean" ? value.verified : undefined;
  const auditInput: CreateAuditLogInput = {
    actorType: "SYSTEM",
    entityType: "WHATSAPP_ACCOUNT",
    entityId: account.id,
    action: "STATUS_CHANGE",
    description: `account_update → ${event}`,
    metadata: {
      event,
      verified: verified ?? null,
      disconnectionReason,
      banState,
      phoneNumberHint: toSafeString(value.phone_number)?.slice(-4) ?? null,
    },
  };
  try {
    await AuditService.createManyAuditLogs([auditInput]);
  } catch (error) {
    logger.error("whatsapp-webhook-handler: lifecycle audit failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * `account_update` lifecycle dispatcher. Every recognized event writes an
 * audit row; dangerous transitions also flip account state and evict the
 * per-account adapter so subsequent sends fail fast before touching Meta.
 */
export async function handleAccountUpdate(value: Record<string, unknown>, wabaId: string): Promise<void> {
  const account = await resolveLifecycleAccount(value, wabaId);
  if (!account) {
    return;
  }
  const event = toSafeString(value.event) ?? "UNKNOWN";
  await WhatsappAccountService.systemUpdateAccount(account.id, { lastWebhookAt: new Date() });

  switch (event) {
    case "ACCOUNT_OFFBOARDED":
      await applyAccountOffboarded(account);
      break;
    case "ACCOUNT_RECONNECTED":
      await applyAccountReconnected(account);
      break;
    case "PARTNER_APP_UNINSTALLED":
    case "PARTNER_REMOVED":
      await applyAccountDeactivated(account, event);
      break;
    default:
      break;
  }
  await writeLifecycleAudit(account, event, value, parseDisconnectionReason(value));
}
