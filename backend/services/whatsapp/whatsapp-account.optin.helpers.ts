import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import { buildReturnType } from "@/backend/lib";
import { resetWhatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { EVENT_CHANNEL_ALLOWLIST } from "@/backend/services/notification/notification-dispatch.helpers";
import { NOTIFICATION_TEMPLATE_MAP } from "@/backend/services/notification/notification-payloads.builders";
import { assertSuperAdmin, auditChange } from "@/backend/services/whatsapp/whatsapp-account.shared.helpers";
import type { DBTransaction, NotificationPreferenceUpdateInput, WhatsappAccountReturnType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Toggles a user's WhatsApp opt-in: writes one preference row per
 * WhatsApp-dispatchable event, emits the opt-in audit row, resets the channel
 * singleton, and returns the first active account for Apollo normalization.
 */
export async function applyUserWhatsappOptIn(
  actorUserId: string,
  tErrors: ErrorsLabels,
  userId: string,
  enabled: boolean,
  source: string,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  if (userId !== actorUserId) {
    await assertSuperAdmin(actorUserId, tErrors);
  }

  // Sanitize source to prevent log injection: replace newlines and truncate.
  const sanitizedSource = source
    .replace(/[\r\n]/g, " ")
    .trim()
    .slice(0, 200);

  // Only write opt-in/out prefs for event types that can dispatch over
  // WhatsApp: dispatch treats an EVENT_CHANNEL_ALLOWLIST entry that omits
  // WHATSAPP as "WhatsApp excluded", while an ABSENT entry means the event
  // dispatches over all channels (whatsapp included). The
  // NOTIFICATION_TEMPLATE_MAP check additionally skips events with no
  // WhatsApp template, so the preferences table is not spammed with rows
  // for events that will never dispatch WhatsApp.
  const whatsappEventTypes = (Object.values(NotificationEventType) as NotificationEventType[]).filter(eventType => {
    const allowed = EVENT_CHANNEL_ALLOWLIST[eventType];
    return (!allowed || allowed.includes(NotificationChannel.WHATSAPP)) && NOTIFICATION_TEMPLATE_MAP[eventType] != null;
  });
  const inputs: NotificationPreferenceUpdateInput[] = whatsappEventTypes.map(eventType => ({
    channel: NotificationChannel.WHATSAPP,
    eventType,
    enabled,
  }));
  await NotificationPreferencesRepository.batchUpsert(userId, inputs, tx);

  // Write the audit log BEFORE resetting the channel singleton — if reset
  // throws, the audit trail for this security-relevant action is still
  // preserved. auditChange already swallows its own errors internally.
  await auditChange(
    actorUserId,
    "WHATSAPP_OPT_IN",
    userId,
    {
      description: `${enabled ? "Enabled" : "Disabled"} WhatsApp opt-in for user ${userId} (source: ${sanitizedSource})`,
      previousState: { whatsappEnabled: !enabled },
      newState: { whatsappEnabled: enabled },
      metadata: { userId, source: sanitizedSource, whatsappEnabled: enabled },
    },
    tx
  );

  // REQ-12.4: Reset WhatsApp channel singleton to pick up new opt-in state
  await resetWhatsappChannel();

  // Return the first active WhatsApp account for Apollo cache normalization
  const account = await WhatsappAccountRepository.findFirstActiveForCredentials(tx);
  if (!account) return null;
  const {
    encryptedAccessToken: _at,
    encryptedTwoStepPin: _pin,
    qualityRating,
    portfolioMessagingLimitTier,
    ...rest
  } = account;
  return buildReturnType(rest, qualityRating, portfolioMessagingLimitTier);
}
