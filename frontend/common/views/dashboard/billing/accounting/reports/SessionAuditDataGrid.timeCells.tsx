import { Box, Stack, Tooltip } from "@mui/material";
import { formatDateTime, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import { ELLIPSIZED_CELL_SX } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.constants";
import { formatCompactSessionTime } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.formatters";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

interface SessionTimeCellProps {
  /** Raw ISO timestamp from the report row; null renders the muted placeholder. */
  readonly value: string | null;
  /** Booking timezone snapshot recorded when the session was scheduled; tooltip-only context. */
  readonly bookingTimezone: string | null;
  readonly locale: string;
  readonly labels: SessionAuditLabels;
  /** Which timestamp this cell renders; selects the formatter and placeholder copy. */
  readonly kind: "open" | "end";
  /** Whether the session was actually joined; gates the end cell's in-progress placeholder. */
  readonly sessionStarted: boolean;
}

/**
 * Missing-timestamp copy for a time cell: a room-exit placeholder reads
 * "in progress" only once the session has actually started; sessions never
 * joined read "not joined" in both cells.
 */
function resolveTimeCellPlaceholder(kind: "open" | "end", sessionStarted: boolean, labels: SessionAuditLabels): string {
  if (kind === "open" || !sessionStarted) {
    return labels.cell.notJoined;
  }
  return labels.cell.inProgress;
}

/**
 * Room-entry / room-exit cell: localized timestamp in the operator's time zone,
 * with a hover tooltip revealing the raw UTC value and the booking timezone.
 * Missing timestamps render as muted placeholders and carry no tooltip.
 */
export function SessionTimeCell({
  value,
  bookingTimezone,
  locale,
  labels,
  kind,
  sessionStarted,
}: Readonly<SessionTimeCellProps>) {
  const placeholder = resolveTimeCellPlaceholder(kind, sessionStarted, labels);
  if (value === null || value.trim() === "") {
    return (
      <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
        {placeholder}
      </Box>
    );
  }
  const tooltip = (
    <Stack sx={{ gap: 0.25 }}>
      <Box component="span">{labels.tooltip.rawUtc(value)}</Box>
      {bookingTimezone !== null && bookingTimezone !== "" ? (
        <Box component="span">{labels.tooltip.bookingTimezone(bookingTimezone)}</Box>
      ) : null}
    </Stack>
  );
  return (
    <Tooltip title={tooltip}>
      <Box component="span" sx={ELLIPSIZED_CELL_SX}>
        {formatCompactSessionTime(value, locale, placeholder)}
      </Box>
    </Tooltip>
  );
}

interface ScheduledStartCellProps {
  /** Raw ISO timestamp; sessions are scheduled in the future so this is always present. */
  readonly value: string | null | undefined;
  readonly locale: string;
  /** Muted placeholder rendered when the row carries no scheduled start. */
  readonly fallback: string;
}

/**
 * Scheduled-start cell: compact date-plus-time without the year keeps the
 * column narrow; the full localized timestamp is revealed in a hover tooltip
 * (keyboard users focus the cell content). Corrupt non-empty values pass
 * through verbatim so bad data stays visible instead of masquerading empty.
 */
export function ScheduledStartCell({ value, locale, fallback }: Readonly<ScheduledStartCellProps>) {
  const parsed = parseDateInput(value);
  if (parsed !== null) {
    return (
      <Tooltip title={formatDateTime(parsed, locale)}>
        <Box component="span" sx={ELLIPSIZED_CELL_SX}>
          {formatCompactSessionTime(parsed, locale, fallback)}
        </Box>
      </Tooltip>
    );
  }
  const verbatim = value?.trim() ?? "";
  if (verbatim.length > 0) {
    return (
      <Box component="span" sx={ELLIPSIZED_CELL_SX}>
        {verbatim}
      </Box>
    );
  }
  return (
    <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
      {fallback}
    </Box>
  );
}
