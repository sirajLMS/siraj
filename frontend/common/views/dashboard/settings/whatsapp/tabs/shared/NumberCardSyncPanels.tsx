"use client";

import { ReplayOutlined } from "@mui/icons-material";
import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  getWhatsappSyncStatusAlertSeverity,
  type WhatsappSyncAlertSeverity,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";

/** Labels the coexistence sync-state panels need (subset of the card labels). */
export interface SyncPanelLabels {
  readonly syncStatusComplete: string;
  readonly syncStatusFailed: string;
  readonly syncHistoryDeclined: string;
  readonly syncProgress: (percent: number) => string;
  readonly connectBusinessApp: string;
  /** Phase caption on the streaming panel (whatsapp `syncPhaseLabel`). */
  readonly syncPhaseLabel: (phase: number) => string;
  /** Deadline hint on the streaming panel (whatsapp `syncDeadlineHint`). */
  readonly syncDeadlineHint: (deadline: string) => string;
  /** Declined-history guidance on the failed panel (whatsapp `syncDeclinedGuidance`). */
  readonly syncDeclinedGuidance: string;
}

function clampProgress(progress: number | null): number {
  return Math.min(100, Math.max(0, progress ?? 0));
}

/** Localized datetime for the sync deadline; null when past or unparsable. */
function futureDeadlineText(syncDeadlineAt: string | null | undefined): string | null {
  if (!syncDeadlineAt) return null;
  const date = new Date(syncDeadlineAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  return date.toLocaleString();
}

function PanelAlert({ severity, children }: Readonly<{ severity: WhatsappSyncAlertSeverity; children: ReactNode }>) {
  return (
    <Alert severity={severity} sx={{ width: "100%" }}>
      <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
        {children}
      </Stack>
    </Alert>
  );
}

/**
 * In-flight sync panel: determinate progress with percentage, the raw sync
 * phase while Meta streams history chunks, and the remaining-window deadline
 * while it is still ahead.
 */
export function SyncProgressPanel({
  labels,
  phase,
  progress,
  syncDeadlineAt,
}: Readonly<{
  labels: SyncPanelLabels;
  phase: number | null;
  progress: number | null;
  syncDeadlineAt?: string | null;
}>) {
  const value = clampProgress(progress);
  const deadlineText = futureDeadlineText(syncDeadlineAt);
  return (
    <PanelAlert severity={getWhatsappSyncStatusAlertSeverity("SYNCING") ?? "info"}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
        <LinearProgress variant="determinate" value={value} sx={{ flexGrow: 1 }} />
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.syncProgress(value)}
        </Typography>
      </Box>
      {phase !== null && phase > 0 ? (
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.syncPhaseLabel(phase)}
        </Typography>
      ) : null}
      {deadlineText === null ? null : (
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary })} dir="ltr">
          {labels.syncDeadlineHint(deadlineText)}
        </Typography>
      )}
    </PanelAlert>
  );
}

/**
 * Failed sync panel: humanized failure reason (the history-declined case swaps
 * in the dedicated declined title plus the declined guidance sentence) and a
 * retry affordance that re-opens Embedded Signup when the tab wired one through.
 */
export function SyncFailedPanel({
  labels,
  syncFailureReason,
  onRetrySetup,
}: Readonly<{
  labels: SyncPanelLabels;
  syncFailureReason?: string | null;
  onRetrySetup?: () => void;
}>) {
  const declined = syncFailureReason === "historyDeclined";
  const title = declined ? labels.syncHistoryDeclined : labels.syncStatusFailed;
  const detail = declined ? labels.syncDeclinedGuidance : (syncFailureReason ?? null);
  return (
    <PanelAlert severity={getWhatsappSyncStatusAlertSeverity("FAILED") ?? "error"}>
      <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {detail === null ? null : <Typography variant="bodyMd">{detail}</Typography>}
      {onRetrySetup ? (
        <Button
          size="small"
          startIcon={<ReplayOutlined fontSize="small" />}
          onClick={onRetrySetup}
          sx={theme => ({ color: theme.palette.error.main, px: 0 })}
        >
          {labels.connectBusinessApp}
        </Button>
      ) : null}
    </PanelAlert>
  );
}

/** Completed sync panel: success-styled summary with the completion date. */
export function SyncCompletePanel({
  labels,
  completedAt,
}: Readonly<{ labels: SyncPanelLabels; completedAt: string | null }>) {
  const date = completedAt === null ? null : new Date(completedAt);
  return (
    <PanelAlert severity={getWhatsappSyncStatusAlertSeverity("COMPLETE") ?? "success"}>
      <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
        {labels.syncStatusComplete}
      </Typography>
      {date === null || Number.isNaN(date.getTime()) ? null : (
        <Typography variant="bodyMd" dir="ltr">
          {date.toLocaleString()}
        </Typography>
      )}
    </PanelAlert>
  );
}
