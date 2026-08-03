import { NotificationChannel } from "@/backend/enum";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Returns a generic, user-safe delivery failure message for the given channel.
 * Provider-specific error details MUST NOT be exposed to end users —
 * they are logged internally and stored in failureReason instead.
 */
export function deliveryFailedMessage(channel: NotificationChannel, locale: string): string {
  const t = getServerTranslations(locale).errorsTranslations;
  const labelMap: Record<NotificationChannel, string> = {
    [NotificationChannel.EMAIL]: t.emailChannelLabel,
    [NotificationChannel.SMS]: t.smsChannelLabel,
    [NotificationChannel.PUSH]: t.pushChannelLabel,
    [NotificationChannel.WHATSAPP]: t.whatsappChannelLabel,
    [NotificationChannel.ON_APP]: t.onAppChannelLabel,
  };
  return t.deliveryFailed(labelMap[channel]);
}
