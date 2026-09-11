"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { WhatsappOnboardingMode, WhatsappSyncStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type NumberCardLabels,
  NumberCardStatusChip,
  type NumberCardSyncProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import {
  SyncCompletePanel,
  SyncFailedPanel,
  SyncProgressPanel,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardSyncPanels";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getPurposeLabel } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions";
import {
  getWhatsappPurposeBadgeConfig,
  getWhatsappSyncStatusBadgeConfig,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { getSyncStatusLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappSyncStatusLabel";

const SYNC_LABEL_KEYS = [
  "syncStatusNotStarted",
  "syncStatusRequested",
  "syncStatusSyncing",
  "syncStatusComplete",
  "syncStatusFailed",
] as const;

type SyncLabelKey = (typeof SYNC_LABEL_KEYS)[number];

function isSyncLabelKey(key: string): key is SyncLabelKey {
  return (SYNC_LABEL_KEYS as readonly string[]).includes(key);
}

function syncLabel(t: NumberCardLabels, syncStatus: string): string {
  const key = getSyncStatusLabelKey(syncStatus);
  return isSyncLabelKey(key) ? t[key] : syncStatus;
}

function PurposeChip({ labels, purpose }: Readonly<{ labels: NumberCardLabels; purpose: string }>) {
  const config = getWhatsappPurposeBadgeConfig(purpose);
  return <StatusBadge category={config.category} status={config.status} label={getPurposeLabel(labels, purpose)} />;
}

function OnboardingModeChip({ labels, mode }: Readonly<{ labels: NumberCardLabels; mode: WhatsappOnboardingMode }>) {
  const isCoexistence = mode === WhatsappOnboardingMode.Coexistence;
  const label = isCoexistence ? labels.onboardingModeCoexistence : labels.onboardingModeCloudApi;
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <StatusBadge category="syncStatus" status="unknown" label={label} />
      {isCoexistence ? (
        <Tooltip title={labels.coexistenceRestrictionsHint} arrow>
          <InfoOutlined
            fontSize="small"
            titleAccess={labels.coexistenceRestrictionsHint}
            sx={theme => ({ color: theme.palette.text.secondary })}
          />
        </Tooltip>
      ) : null}
    </Box>
  );
}

/**
 * Coexistence sync section: the status badge row plus a state panel —
 * streaming progress (with phase and future-deadline hints) while REQUESTED/
 * SYNCING, a success summary on COMPLETE, and an error panel with the
 * humanized failure reason and an optional retry-into-Embedded-Signup action
 * on FAILED.
 */
function CoexistenceSyncRow({
  labels,
  account,
  syncFailureReason,
  syncDeadlineAt,
  onRetrySetup,
}: Readonly<{ labels: NumberCardLabels; account: WhatsappAccountRow } & NumberCardSyncProps>) {
  const syncStatus = account.syncStatus ?? null;
  if (syncStatus === null) {
    return null;
  }
  const config = getWhatsappSyncStatusBadgeConfig(syncStatus);
  const isStreaming = syncStatus === WhatsappSyncStatus.Requested || syncStatus === WhatsappSyncStatus.Syncing;
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700 })}>
          {labels.syncStatusLabel}
        </Typography>
        <StatusBadge category={config.category} status={config.status} label={syncLabel(labels, syncStatus)} />
      </Box>
      {isStreaming ? (
        <SyncProgressPanel
          labels={labels}
          phase={account.syncPhase ?? null}
          progress={account.syncProgress ?? null}
          syncDeadlineAt={syncDeadlineAt ?? null}
        />
      ) : null}
      {syncStatus === WhatsappSyncStatus.Failed ? (
        <SyncFailedPanel labels={labels} syncFailureReason={syncFailureReason ?? null} onRetrySetup={onRetrySetup} />
      ) : null}
      {syncStatus === WhatsappSyncStatus.Complete ? (
        <SyncCompletePanel labels={labels} completedAt={account.updatedAt ?? null} />
      ) : null}
    </Box>
  );
}

/**
 * Purpose / onboarding / coexistence-sync section of the numbers card: a
 * purpose chip and onboarding-mode chip (with the coexistence restrictions
 * tooltip), plus a sync-status badge with the state panel for accounts whose
 * one-shot history sync is streaming, failed, or complete.
 */
export function NumberCardPurposeSync({
  account,
  labels: t,
  syncFailureReason,
  syncDeadlineAt,
  onRetrySetup,
}: Readonly<{ readonly account: WhatsappAccountRow; readonly labels: NumberCardLabels } & NumberCardSyncProps>) {
  const purpose = account.purpose ?? null;
  const mode = account.onboardingMode ?? null;
  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        {purpose === null ? null : (
          <NumberCardStatusChip caption={t.purposeLabel} badge={<PurposeChip labels={t} purpose={purpose} />} />
        )}
        {mode === null ? null : (
          <NumberCardStatusChip caption={t.onboardingModeLabel} badge={<OnboardingModeChip labels={t} mode={mode} />} />
        )}
      </Box>
      {mode === WhatsappOnboardingMode.Coexistence ? (
        <CoexistenceSyncRow
          labels={t}
          account={account}
          syncFailureReason={syncFailureReason ?? null}
          syncDeadlineAt={syncDeadlineAt ?? null}
          onRetrySetup={onRetrySetup}
        />
      ) : null}
    </Stack>
  );
}
