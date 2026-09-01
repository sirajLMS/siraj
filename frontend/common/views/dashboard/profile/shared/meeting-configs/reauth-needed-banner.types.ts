import type { MeetingConfigActionSlots } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/meetingConfigActionSlots";
import type { MeetingConfigReauthNeededLabels } from "@/shared/locale/types/ui";

export type ExpiryState = "expiring_soon" | "expired" | "unknown";

export type ReauthProvider = {
  readonly slug: string;
  readonly name: string;
  readonly expiryState?: ExpiryState;
};

export type ReauthNeededBannerProps = {
  readonly reauthProviders: readonly ReauthProvider[];
  readonly labels: MeetingConfigReauthNeededLabels;
  readonly onReconnect: (providerSlug: string) => void;
  readonly onReconnectAll?: () => void;
  readonly onDismiss?: () => void;
  readonly actionSlots?: MeetingConfigActionSlots;
};

export function expiryLabel(state: ExpiryState | undefined, labels: MeetingConfigReauthNeededLabels): string {
  switch (state) {
    case "expiring_soon":
      return labels.reauthExpiringSoon;
    case "expired":
      return labels.reauthExpired;
    default:
      return labels.reconnectRequiredBadge;
  }
}
