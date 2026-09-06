"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { NumberCardPurposeSync } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardPurposeSync";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getQualityLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappQualityLabel";
import { getWhatsappAccountStatusBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { getThroughputLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappThroughputLabel";
import { getTierLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappTierLabel";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Reducible enum-label i18n keys (quality, tier, throughput, template status). */
const LABEL_KEYS = [
  "qualityGreen",
  "qualityYellow",
  "qualityRed",
  "qualityUnknown",
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

/** Common labels needed for account card metadata and warnings. */
export type NumberCardLabels = Pick<
  WhatsappLabels,
  | "qualityRating"
  | "messagingTier"
  | "throughputLevel"
  | "throughput24h"
  | "lastWebhookAt"
  | "isActive"
  | "isInactive"
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
  | "onboardingModeCloudApi"
  | "onboardingModeCoexistence"
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
>;

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
        <Box>
          <StatusBadge
            {...getWhatsappAccountStatusBadgeConfig(account.isActive)}
            label={account.isActive ? t.isActive : t.isInactive}
          />
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
