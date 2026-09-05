"use client";

import { Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import type { SessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

type SessionAuditStatusChipColor = "default" | "info" | "success" | "error" | "warning";

/**
 * Semantic chip color per session audit status: running sessions are blue,
 * ended sessions green, teacher absence red, and student absence amber.
 * Colors resolve through `theme.palette`, so light/dark modes and palette
 * presets stay honored.
 */
const SESSION_AUDIT_STATUS_COLORS: Record<SessionAuditStatus, SessionAuditStatusChipColor> = {
  open: "info",
  end: "success",
  Absent: "error",
  absent_student: "warning",
};

/**
 * Recency window for the live-session pulse: a running session whose room
 * entry is older than this renders as a plain (non-pulsing) chip, since it
 * reads as a historical row rather than something happening right now.
 */
export const SESSION_AUDIT_PULSE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * A session pulses only while it is genuinely live and fresh: the status is
 * open, a room-entry timestamp exists, no room-exit timestamp has been
 * recorded yet, and the entry happened within the pulse window.
 */
function isSessionAuditPulseActive(
  status: SessionAuditStatus,
  actualStartAt: Date | string | null | undefined,
  actualEndAt: Date | string | null | undefined,
  now: number
): boolean {
  if (status !== "open" || actualStartAt == null || actualEndAt != null) {
    return false;
  }
  const startedAt = new Date(actualStartAt).getTime();
  if (Number.isNaN(startedAt)) {
    return false;
  }
  const elapsed = now - startedAt;
  return elapsed >= 0 && elapsed <= SESSION_AUDIT_PULSE_WINDOW_MS;
}

export interface SessionAuditStatusChipProps {
  /** Audit status of the report row; drives both chip color and label. */
  readonly status: SessionAuditStatus;
  /** Localized per-status labels from the session-audit namespace. */
  readonly labels: SessionAuditLabels["status"];
  /** Room-entry timestamp of the row; required to trigger the live pulse. */
  readonly actualStartAt?: Date | string | null;
  /** Room-exit timestamp; a session that has ended never pulses. */
  readonly actualEndAt?: Date | string | null;
  /** Clock override in epoch milliseconds for deterministic rendering (tests); defaults to the current time. */
  readonly now?: number;
}

export function SessionAuditStatusChip({
  status,
  labels,
  actualStartAt = null,
  actualEndAt = null,
  now,
}: Readonly<SessionAuditStatusChipProps>) {
  const label = labels[status];
  // Capture the clock once per mount via a lazy state initializer — reading
  // Date.now() during render trips the purity rule, while a mount-time
  // snapshot is stable and sufficient for a coarse recency window.
  const [renderTimestamp] = useState(() => now ?? Date.now());
  const pulseActive = isSessionAuditPulseActive(status, actualStartAt, actualEndAt, renderTimestamp);

  return (
    <Chip
      size="small"
      color={SESSION_AUDIT_STATUS_COLORS[status]}
      label={label}
      aria-label={label}
      data-pulse-active={pulseActive || undefined}
      sx={
        pulseActive
          ? theme => ({
              animation: "sessionAuditStatusPulse 1.6s ease-in-out infinite",
              "@keyframes sessionAuditStatusPulse": {
                "0%, 100%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.info.main, 0.4)}` },
                "50%": { boxShadow: `0 0 0 6px ${alpha(theme.palette.info.main, 0)}` },
              },
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            })
          : undefined
      }
    />
  );
}
