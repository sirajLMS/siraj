import { CheckCircleOutlined } from "@mui/icons-material";
import { Box, Chip, Stack, Tooltip } from "@mui/material";
import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import { StatusBadge } from "@/frontend/common/components/ui";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

interface CalculationStatusCellProps {
  readonly status: CalculationStatus | null;
  /** Payment timestamp of the settled teacher due; only meaningful for paid rows. */
  readonly paymentDateIso: string | null;
  readonly locale: string;
  readonly cellLabels: SessionAuditLabels["cell"];
  readonly statusLabels: Record<CalculationStatus, string>;
}

/**
 * Payroll status cell: grey dash while uncalculated, the status badge
 * otherwise, and for paid rows a success marker whose tooltip reveals when the
 * payment was made.
 */
export function CalculationStatusCell({
  status,
  paymentDateIso,
  locale,
  cellLabels,
  statusLabels,
}: Readonly<CalculationStatusCellProps>) {
  if (status === null) {
    return (
      <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
        {cellLabels.notCalculated}
      </Box>
    );
  }
  const chip = <StatusBadge category="payrollCalculation" status={status} label={statusLabels[status]} />;
  if (status === CalculationStatus.Paid && paymentDateIso !== null) {
    return (
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
        {chip}
        <Tooltip title={formatDateTime(paymentDateIso, locale)}>
          <CheckCircleOutlined fontSize="small" sx={theme => ({ color: theme.palette.success.main })} />
        </Tooltip>
      </Stack>
    );
  }
  return chip;
}

interface PersonNameCellProps {
  readonly value: string | null;
}

/**
 * Person/subject name cell. Teacher/student names are often Latin while the
 * surrounding grid row may be RTL; without an isolated direction context the
 * bidi algorithm clips the name's leading characters at the cell edge. The
 * `dir="auto"` + `unicode-bidi: isolate` span anchors each name in its own
 * direction while `text-align: start` keeps it flush with the cell's inline
 * start, so truncation always removes trailing characters.
 */
export function PersonNameCell({ value }: Readonly<PersonNameCellProps>) {
  if (value === null || value.trim() === "") {
    return null;
  }
  return (
    <Box
      component="span"
      dir="auto"
      title={value}
      sx={{
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: "start",
        unicodeBidi: "isolate",
      }}
    >
      {value}
    </Box>
  );
}

interface CarryoverLinkCellProps {
  readonly carryoverBalanceId: string | null;
  readonly chipLabel: string;
  /** Muted placeholder rendered while the session is not linked to any carryover. */
  readonly emptyText: string;
  readonly onOpen: (carryoverBalanceId: string) => void;
}

/**
 * Carryover-link column cell: a clickable chip on rows already rolled into a
 * carryover balance (navigates to the carryover detail route), or the muted
 * placeholder while the session is still unlinked.
 */
export function CarryoverLinkCell({
  carryoverBalanceId,
  chipLabel,
  emptyText,
  onOpen,
}: Readonly<CarryoverLinkCellProps>) {
  if (carryoverBalanceId === null || carryoverBalanceId === "") {
    return (
      <Box component="span" sx={theme => ({ color: theme.palette.text.secondary })}>
        {emptyText}
      </Box>
    );
  }
  return (
    <Chip
      size="small"
      clickable
      color="success"
      variant="outlined"
      label={chipLabel}
      aria-label={chipLabel}
      onClick={() => onOpen(carryoverBalanceId)}
    />
  );
}
