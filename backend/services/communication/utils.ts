import type { NotificationChannel } from "@/backend/enum";

type LowercaseEnumValue<T extends string, ExcludeVal extends string> = Lowercase<Exclude<`${T}`, ExcludeVal>>;

type DeliveryChannel = LowercaseEnumValue<NotificationChannel, "ON_APP">;

const CHANNEL_LABELS: Record<DeliveryChannel, string> = {
  email: "Email",
  push: "Push notification",
  sms: "SMS",
} as const;

/**
 * Returns a generic, user-safe delivery failure message for the given channel.
 * Provider-specific error details MUST NOT be exposed to end users —
 * they are logged internally and stored in failureReason instead.
 */
export function deliveryFailedMessage(channel: DeliveryChannel): string {
  return `${CHANNEL_LABELS[channel]} delivery failed. Please try again later.`;
}
