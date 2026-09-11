"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge, type StatusBadgeCategory } from "@/frontend/common/components/ui/badge/StatusBadge";
import { NumberCardPurposeSync } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardPurposeSync";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getMetaStatusLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappMetaStatusLabel";
import { getQualityLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappQualityLabel";
import {
  getWhatsappAccountStatusBadgeConfig,
  getWhatsappMetaStatusBadgeConfig,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { getThroughputLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappThroughputLabel";
import { getTierLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappTierLabel";
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

function resolveLabel(key: string, t: NumberCardLabels): string {
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

/** Labelled metadata pair (label caption over value) used for account attributes. */
export function NumberCardField({ label, value }: Readonly<{ readonly label: string; readonly value: string }>) {
  return (
    <Box>
      <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700 })}>
        {label}
      </Typography>
      <Typography variant="bodyMd">{value}</Typography>
    </Box>
  );
}

/** Caption + badge pair used to make each card state chip self-describing. */
export function NumberCardStatusChip({
  caption,
  badge,
}: Readonly<{ readonly caption: string; readonly badge: ReactNode }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700 })}>
        {caption}
      </Typography>
      {badge}
    </Box>
  );
}

/** Badge styling for the test-number marker chip rendered beside the status chips. */
const TEST_NUMBER_BADGE: { readonly category: StatusBadgeCategory; readonly status: string } = {
  category: "syncStatus",
  status: "partial",
};

/** Props for the shell-less account card content. */
export interface NumberCardContentProps extends NumberCardSyncProps {
  readonly account: WhatsappAccountRow;
  readonly labels: NumberCardLabels;
  /** Header action area (platform-specific — icon buttons on desktop, overflow menu on mobile). */
  readonly action?: ReactNode;
  /** Extra labelled metadata fields (desktop-only: wabaId, phoneNumberId). */
  readonly extraMetadata?: ReactNode;
}

/**
 * Shell-less WhatsApp account card content: title row with action slot, active
 * StatusBadge, and quality/tier/throughput/last-webhook metadata as labelled
 * Typography pairs, followed by coexistence/unverified warning alerts. Hosts:
 * desktop wraps it in `NumberCard` (BaseCard shell), mobile in `MobileCardListItem`.
 */
export function NumberCardContent({
  account,
  labels: t,
  action,
  extraMetadata,
  syncFailureReason,
  syncDeadlineAt,
  onRetrySetup,
}: Readonly<NumberCardContentProps>) {
  const qualityLabel = resolveLabel(getQualityLabelKey(account.qualityRating ?? ""), t);
  const tierLabel = resolveLabel(getTierLabelKey(account.portfolioMessagingLimitTier ?? ""), t);
  const throughputLabel = resolveLabel(getThroughputLabelKey(account.throughputLevel ?? ""), t);
  const metaStatusLabel = resolveLabel(getMetaStatusLabelKey(account.metaStatus ?? null), t);

  const isCoexistence = account.throughputLevel?.toUpperCase() === "COEXISTENCE";
  const isUnverified = account.portfolioMessagingLimitTier?.toUpperCase() === "UNTIERED";

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="titleLg">{account.displayName?.en ?? account.displayPhoneNumber ?? "—"}</Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {account.displayPhoneNumber ?? "—"}
          </Typography>
        </Box>
        {action}
      </Box>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <NumberCardStatusChip
            caption={t.accountStatusLabel}
            badge={
              <StatusBadge
                {...getWhatsappAccountStatusBadgeConfig(account.isActive)}
                label={account.isActive ? t.isActive : t.isInactive}
              />
            }
          />
          <NumberCardStatusChip
            caption={t.metaStatusLabel}
            badge={
              <StatusBadge {...getWhatsappMetaStatusBadgeConfig(account.metaStatus ?? null)} label={metaStatusLabel} />
            }
          />
          {account.isTestNumber === true && t.testNumberBadge ? (
            <StatusBadge {...TEST_NUMBER_BADGE} label={t.testNumberBadge} />
          ) : null}
        </Box>
        <NumberCardPurposeSync
          account={account}
          labels={t}
          syncFailureReason={syncFailureReason}
          syncDeadlineAt={syncDeadlineAt}
          onRetrySetup={onRetrySetup}
        />
        <NumberCardField label={t.qualityRating} value={qualityLabel} />
        <NumberCardField label={t.messagingTier} value={tierLabel} />
        <NumberCardField label={t.throughput24h} value={throughputLabel} />
        {account.lastWebhookAt ? (
          <NumberCardField label={t.lastWebhookAt} value={new Date(account.lastWebhookAt).toLocaleString()} />
        ) : null}
        {extraMetadata}
        {isCoexistence ? (
          <Alert severity="warning" icon={<WarningOutlined />} role="alert">
            <strong>{t.coexistenceWarningTitle}</strong> — {t.coexistenceWarningBody}
          </Alert>
        ) : null}
        {isUnverified ? (
          <Alert severity="info" role="alert">
            <strong>{t.unverifiedWarningTitle}</strong> — {t.unverifiedWarningBody}
          </Alert>
        ) : null}
      </Stack>
    </>
  );
}
