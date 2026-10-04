import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";
import type { WhatsappConversationsLabels } from "@/shared/locale/types/whatsappConversations";

/** Reducible enum-label i18n keys (quality, tier, throughput, template status). */
const LABEL_KEYS = [
  "qualityGreen",
  "qualityYellow",
  "qualityRed",
  "qualityUnknown",
  "metaStatusConnected",
  "metaStatusDisconnected",
  "metaStatusUnknown",
  "tier50",
  "tier250",
  "tier1K",
  "tier10K",
  "tier100K",
  "tierUnlimited",
  "tierUnknown",
  "throughputStandard",
  "throughputCoexistence",
  "throughputHigh",
  "throughputUnknown",
] as const satisfies readonly string[];

type LabelKey = (typeof LABEL_KEYS)[number];

function isLabelKey(key: string): key is LabelKey {
  return (LABEL_KEYS as readonly string[]).includes(key);
}

/** Maps a label key produced by the whatsapp status helpers to its translated copy, passing raw keys through. */
export function resolveLabel(key: string, t: NumberCardLabels): string {
  return isLabelKey(key) ? t[key] : key;
}

/**
 * Common labels needed for account card metadata and warnings. The optional
 * `testNumberBadge` caption lives in the whatsappConversations namespace and is
 * merged in by hosts that render the test-number chip.
 */
export type NumberCardLabels = Pick<
  WhatsappLabels,
  | "qualityRating"
  | "messagingTier"
  | "throughputLevel"
  | "throughput24h"
  | "lastWebhookAt"
  | "isActive"
  | "accountStatusLabel"
  | "isInactive"
  | "metaStatusLabel"
  | "metaStatusConnected"
  | "metaStatusDisconnected"
  | "metaStatusUnknown"
  | "wabaId"
  | "phoneNumberId"
  | "coexistenceWarningTitle"
  | "coexistenceWarningBody"
  | "unverifiedWarningTitle"
  | "unverifiedWarningBody"
  | "warningTierExceeded"
  | "warningCoexistence"
  | "purposeGeneral"
  | "purposeAdvertising"
  | "purposeStudents"
  | "purposeLabel"
  | "onboardingModeCloudApi"
  | "onboardingModeCoexistence"
  | "onboardingModeLabel"
  | "coexistenceRestrictionsHint"
  | "syncStatusLabel"
  | "syncStatusNotStarted"
  | "syncStatusRequested"
  | "syncStatusSyncing"
  | "syncStatusComplete"
  | "syncStatusFailed"
  | "syncHistoryDeclined"
  | "connectBusinessApp"
  | "syncProgress"
  | "syncPhaseLabel"
  | "syncDeadlineHint"
  | "syncDeclinedGuidance"
  | "qualityGreen"
  | "qualityYellow"
  | "qualityRed"
  | "qualityUnknown"
  | "tier50"
  | "tier250"
  | "tier1K"
  | "tier10K"
  | "tier100K"
  | "tierUnlimited"
  | "tierUnknown"
  | "throughputStandard"
  | "throughputCoexistence"
  | "throughputHigh"
  | "throughputUnknown"
> &
  Partial<Pick<WhatsappConversationsLabels, "testNumberBadge">>;

/** Optional coexistence sync details/actions threaded into the number card. */
export interface NumberCardSyncProps {
  /** Failure reason code (e.g. `historyDeclined`) once the account snapshot surfaces it. */
  readonly syncFailureReason?: string | null;
  /** Sync window deadline (ISO); the streaming panel hints it while still in the future. */
  readonly syncDeadlineAt?: string | null;
  /** Re-opens Embedded Signup so a failed sync can be re-run from the card. */
  readonly onRetrySetup?: () => void;
}
