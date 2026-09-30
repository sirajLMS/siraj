"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Button, Stack } from "@mui/material";
import type * as React from "react";
import { useCallback } from "react";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton";
import {
  type MeetingUrlStatus,
  MeetingUrlStatusBadge,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
import { Link } from "@/shared/i18n";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { MeetingUrlStatusLabels } from "@/shared/locale/types/dashboard/meeting-url-status";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeetingUrlCellProps {
  /** The meeting join URL (nullable when not generated). */
  readonly meetingUrl: string | null | undefined;
  /** Meeting URL generation status from the codegen field (nullable until backend populates). */
  readonly meetingUrlStatus?: string | null;
  /** Optional error message from failed generation. */
  readonly meetingUrlError?: string | null;
  /** Label for the "Join" action button. */
  readonly joinLabel?: string;
  /** Href for the "Setup config" link shown when URL is null. */
  readonly setupHref?: string;
  /** Compact layout for inline data-table cells (desktop). */
  readonly compact?: boolean;
  /** Badge size variant (matches MeetingUrlStatusBadge size variant). */
  readonly badgeSize?: "small" | "medium";
  /** When false, the copy-URL button is hidden (permission-gated by the caller). */
  readonly canCopyUrl?: boolean;
  /** Callback when the join button is clicked (defaults to opening URL in new tab). */
  readonly onJoin?: () => void;
  /** Callback when retry generation is clicked for failed URLs. */
  readonly onRetry?: () => void;
}

// ---------------------------------------------------------------------------
// Status mapping: codegen string → MeetingUrlStatus union
// ---------------------------------------------------------------------------

function mapStatus(status: string | null | undefined, hasUrl: boolean): MeetingUrlStatus {
  if (status === "failed") return "failed";
  if (status === "expired") return "expired";
  if (status === "pending") return "pending";
  if (hasUrl && (status === "generated" || !status)) return "generated";
  return "pending";
}

// ---------------------------------------------------------------------------
// Internal: join button
// ---------------------------------------------------------------------------

function JoinButton({
  url,
  label,
  onJoin,
  variant = "text",
  buttonSize = "small",
}: {
  readonly url: string;
  readonly label: string;
  readonly onJoin: (() => void) | undefined;
  readonly variant?: "text" | "outlined";
  readonly buttonSize?: "small" | "medium";
}): React.ReactElement {
  const handleClick = useCallback(() => {
    if (onJoin) {
      onJoin();
    } else {
      safeOpenWindow(url);
    }
  }, [onJoin, url]);

  return (
    <Button
      size={buttonSize}
      variant={variant}
      startIcon={<OpenInNewOutlinedIcon />}
      onClick={handleClick}
      aria-label={label}
    >
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Render: compact (desktop inline data-table cell)
// ---------------------------------------------------------------------------

function renderCompactCell(
  meetingUrl: string,
  status: MeetingUrlStatus,
  labels: MeetingUrlStatusLabels,
  joinLabel: string,
  onJoin: (() => void) | undefined,
  onRetry: (() => void) | undefined,
  error: string | null | undefined,
  badgeSize: "small" | "medium",
  canCopyUrl: boolean
): React.ReactElement {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "nowrap" }}>
      <MeetingUrlStatusBadge status={status} size={badgeSize} tooltip={error ?? null} />
      {status === "generated" ? (
        <>
          <JoinButton url={meetingUrl} label={joinLabel} onJoin={onJoin} />
          {canCopyUrl ? (
            <CopyMeetingUrlButton
              meetingUrl={meetingUrl}
              size="small"
              tooltipLabel={labels.copyUrl}
              ariaLabel={labels.copyUrl}
            />
          ) : null}
        </>
      ) : null}
      {status === "failed" && onRetry ? (
        <Button size="small" variant="text" onClick={onRetry}>
          {labels.retryUrlGeneration}
        </Button>
      ) : null}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Render: null state (URL not generated)
// ---------------------------------------------------------------------------

function renderNullState(
  labels: MeetingUrlStatusLabels,
  setupHref: string | undefined,
  compact: boolean
): React.ReactElement {
  return (
    <Stack
      direction={compact ? "row" : "column"}
      sx={theme => ({
        alignItems: compact ? "center" : "flex-start",
        gap: 0.75,
        color: theme.palette.text.secondary,
      })}
    >
      <span>{labels.urlNotGenerated}</span>
      {setupHref ? (
        <Link href={setupHref} style={{ textDecoration: "none" }}>
          <Button size="small" variant="text" startIcon={<SettingsOutlinedIcon />}>
            {labels.setupMeetingConfig}
          </Button>
        </Link>
      ) : null}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Render: full layout (mobile card section with badge top + buttons below)
// ---------------------------------------------------------------------------

function renderFullLayout(
  meetingUrl: string,
  status: MeetingUrlStatus,
  labels: MeetingUrlStatusLabels,
  joinLabel: string,
  onJoin: (() => void) | undefined,
  onRetry: (() => void) | undefined,
  error: string | null | undefined,
  badgeSize: "small" | "medium",
  canCopyUrl: boolean
): React.ReactElement {
  return (
    <Stack sx={{ gap: 1.5 }}>
      <MeetingUrlStatusBadge status={status} size={badgeSize} tooltip={error ?? null} />
      {status === "generated" ? (
        <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
          <JoinButton url={meetingUrl} label={joinLabel} onJoin={onJoin} variant="outlined" buttonSize="medium" />
          {canCopyUrl ? (
            <CopyMeetingUrlButton
              meetingUrl={meetingUrl}
              size="medium"
              tooltipLabel={labels.copyUrl}
              ariaLabel={labels.copyUrl}
            />
          ) : null}
        </Stack>
      ) : null}
      {status === "failed" && onRetry ? (
        <Button size="small" variant="text" onClick={onRetry}>
          {labels.retryUrlGeneration}
        </Button>
      ) : null}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main: MeetingUrlCell
// ---------------------------------------------------------------------------

export function MeetingUrlCell({
  meetingUrl,
  meetingUrlStatus,
  meetingUrlError,
  joinLabel,
  setupHref,
  compact = false,
  badgeSize = "small",
  canCopyUrl = true,
  onJoin,
  onRetry,
}: Readonly<MeetingUrlCellProps>): React.ReactNode {
  const t = useAppTranslation(Translation.Dashboard.MeetingUrlStatus);
  const hasUrl = Boolean(meetingUrl);

  const resolvedJoinLabel = joinLabel ?? t.joinMeeting;
  const status = mapStatus(meetingUrlStatus, hasUrl);

  let ariaLabel: string;
  if (!hasUrl) {
    ariaLabel = t.urlNotGenerated;
  } else if (status === "failed") {
    ariaLabel = meetingUrlError ? `${t.urlFailed}: ${meetingUrlError}` : t.urlFailed;
  } else if (status === "expired") {
    ariaLabel = t.urlExpired;
  } else if (status === "generated") {
    ariaLabel = `${t.urlReady} — ${resolvedJoinLabel}`;
  } else {
    ariaLabel = t.urlPending;
  }

  if (!hasUrl) {
    return <output aria-label={ariaLabel}>{renderNullState(t, setupHref, compact)}</output>;
  }

  const url = meetingUrl ?? "";

  if (compact) {
    return (
      <output aria-label={ariaLabel}>
        {renderCompactCell(url, status, t, resolvedJoinLabel, onJoin, onRetry, meetingUrlError, badgeSize, canCopyUrl)}
      </output>
    );
  }

  return (
    <output aria-label={ariaLabel}>
      {renderFullLayout(url, status, t, resolvedJoinLabel, onJoin, onRetry, meetingUrlError, badgeSize, canCopyUrl)}
    </output>
  );
}
