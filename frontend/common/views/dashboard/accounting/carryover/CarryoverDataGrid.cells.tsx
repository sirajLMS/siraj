"use client";

import BlockOutlined from "@mui/icons-material/BlockOutlined";
import { Box, Stack, Tooltip } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { PersonProfileLinkCell } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLinkCell";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import {
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  ELLIPSIZED_TEXT_SX,
  EMPTY_VALUE_SX,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.styles";
import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";

interface CarryoverTeacherCellProps {
  readonly row: CarryoverRow;
  readonly disabledTeacherLabel: string;
}

/**
 * Teacher identity cell: profile-linked name with the disabled-teacher chip
 * alongside. The name zone shrinks and ellipsizes inside the cell while the
 * chip keeps its intrinsic width; a hover tooltip reveals the full name.
 */
export function CarryoverTeacherCell({ row, disabledTeacherLabel }: Readonly<CarryoverTeacherCellProps>) {
  const name = row.teacherName ?? row.teacherId ?? "";
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
      <Tooltip title={name}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            "& .MuiStack-root": { minWidth: 0, flex: 1 },
            "& .MuiTypography-root": ELLIPSIZED_TEXT_SX,
          }}
        >
          <PersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: row.teacherId })}
            name={name}
            avatarUrl={row.teacherAvatarUrl}
          />
        </Box>
      </Tooltip>
      {row.isDisabledTeacher === true ? (
        <Box sx={{ flexShrink: 0 }}>
          <StatusBadge
            category="staffAccount"
            status="deactivated"
            label={disabledTeacherLabel}
            icon={<BlockOutlined fontSize="small" />}
          />
        </Box>
      ) : null}
    </Stack>
  );
}

/** One-line students-text excerpt; the full list stays readable on hover. */
export function CarryoverStudentsTextCell({ value }: Readonly<{ value: string | null }>) {
  if (value === null || value.trim() === "") {
    return (
      <Box component="span" sx={EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return (
    <Tooltip title={value}>
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </Box>
    </Tooltip>
  );
}

/**
 * Plain text cell where the absent-value placeholder renders muted so an
 * em-dash never reads as real data beside populated cells.
 */
export function CarryoverValueCell({ text, empty }: Readonly<{ text: string; empty: boolean }>) {
  if (empty) {
    return (
      <Box component="span" sx={EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return <Box component="span">{text}</Box>;
}

/** Money cell: grouped amount with the teacher currency beside it, both theme-toned. */
export function CarryoverMoneyCell({ amount, currency }: Readonly<{ amount: string | null; currency: string | null }>) {
  const isEmpty = amount === null;
  return (
    <Stack direction="row" sx={{ alignItems: "baseline", gap: 0.5 }}>
      <Box component="span" sx={isEmpty ? EMPTY_VALUE_SX : { fontWeight: 600 }}>
        {formatAccountingMoney(amount)}
      </Box>
      {currency !== null ? (
        <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {currency}
        </Box>
      ) : null}
    </Stack>
  );
}

/**
 * Inclusive period the carryover covers, rendered as a from/to two-line stack.
 * The stack is pinned to the cell width and every line is single-line,
 * ellipsized, and overflow-hidden, so a long localized date can never paint
 * past the cell boundary; a hover tooltip reveals the complete period. The
 * compact line-height overrides the grid cell's row-height line-height
 * (`calc(var(--height) - 1px)` ≈ 51px per line) — without it the two lines
 * stack to ~104px inside the 52px row and their slivers bleed past the
 * cell's vertical bounds. Each date line is bidi-isolated (`dir="auto"` +
 * `unicode-bidi`), so the Latin digits / Arabic month mix renders in one
 * stable order and a stray-direction glyph can never paint at the edges.
 */
export function CarryoverPeriodCell({ row, locale }: Readonly<{ row: CarryoverRow; locale: string }>) {
  const from = formatAccountingDate(row.fromDate, locale);
  const to = formatAccountingDate(row.toDate, locale);
  return (
    <Tooltip title={`${from} – ${to}`}>
      <Stack sx={{ gap: 0.25, minWidth: 0, width: "100%", overflow: "hidden", lineHeight: 1.3 }}>
        <Box
          component="span"
          dir="auto"
          sx={{ ...ELLIPSIZED_TEXT_SX, display: "block", lineHeight: 1.3, unicodeBidi: "isolate", textAlign: "start" }}
        >
          {from}
        </Box>
        <Box
          component="span"
          dir="auto"
          sx={theme => ({
            ...ELLIPSIZED_TEXT_SX,
            display: "block",
            lineHeight: 1.3,
            unicodeBidi: "isolate",
            textAlign: "start",
            color: theme.palette.onSurfaceVariant,
          })}
        >
          {to}
        </Box>
      </Stack>
    </Tooltip>
  );
}

interface CarryoverPaidCellProps {
  readonly row: CarryoverRow;
  readonly paidLabel: string;
  readonly unpaidLabel: string;
}

/**
 * Paid state: the paid/unpaid chip with the settled amount beneath it when
 * paid. The amount line gets a compact line-height — the grid cell inherits
 * `line-height` equal to the full row height, so a default second line would
 * be ~51px tall and overflow the 52px row vertically.
 */
export function CarryoverPaidCell({ row, paidLabel, unpaidLabel }: Readonly<CarryoverPaidCellProps>) {
  const paid = row.isPaid === true;
  return (
    <Stack sx={{ gap: 0.5, alignItems: "flex-start", overflow: "hidden" }}>
      <StatusBadge category="session" status={paid ? "active" : "pending"} label={paid ? paidLabel : unpaidLabel} />
      {paid && row.paid !== null ? (
        <Box component="span" sx={theme => ({ color: theme.palette.status.onActiveContainer, lineHeight: 1.3 })}>
          {formatAccountingMoney(row.paid)} {row.teacherCurrency ?? ""}
        </Box>
      ) : null}
    </Stack>
  );
}
