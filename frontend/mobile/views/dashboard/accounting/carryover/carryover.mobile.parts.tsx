"use client";

import { BlockOutlined } from "@mui/icons-material";
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import {
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { CarryoverAggregates } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import {
  CarryoverRowMenu,
  type CarryoverRowMenuProps,
} from "@/frontend/mobile/views/dashboard/accounting/carryover/carryover.mobile.rowMenu";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface CarryoverCardProps extends Omit<CarryoverRowMenuProps, "actionsMenuLabel"> {
  readonly actionsMenuLabel: string;
  readonly locale: string;
}

/** One carryover row as a mobile card: identity + amount, status chip, period, and actions. */
export function CarryoverCard({
  row,
  labels,
  actionsMenuLabel,
  locale,
  canManage,
  ...callbacks
}: Readonly<CarryoverCardProps>) {
  const durationSuffix = row.totalDuration === null || row.totalDuration === "" ? "" : ` · ${row.totalDuration}`;
  return (
    <MobileCardListItem variant="rounded">
      <Stack sx={{ gap: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Stack sx={{ gap: 0.5, minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
              <Typography variant="titleLg">{row.teacherName ?? "—"}</Typography>
              {row.isDisabledTeacher === true ? (
                <StatusBadge
                  category="staffAccount"
                  status="deactivated"
                  label={labels.chip.disabledTeacher}
                  icon={<BlockOutlined fontSize="small" />}
                />
              ) : null}
            </Stack>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.column.studentsCount}: {row.studentsCount ?? 0}
              {durationSuffix}
            </Typography>
          </Stack>
          <Stack sx={{ alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
              {formatAccountingMoney(row.payable)} {row.teacherCurrency ?? ""}
            </Typography>
            <StatusBadge
              category="session"
              status={row.isPaid === true ? "active" : "pending"}
              label={row.isPaid === true ? labels.chip.paid : labels.chip.unpaid}
            />
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {formatAccountingDate(row.fromDate, locale)} – {formatAccountingDate(row.toDate, locale)}
          </Typography>
          <CarryoverRowMenu
            row={row}
            labels={labels}
            actionsMenuLabel={actionsMenuLabel}
            canManage={canManage}
            {...callbacks}
          />
        </Box>
      </Stack>
    </MobileCardListItem>
  );
}

/** Totals strip above the list: emphasized totals plus the filtered record count, stacking on narrow viewports. */
export function CarryoverAggregateStrip({
  aggregates,
  labels,
  totalCount,
}: Readonly<{ aggregates: CarryoverAggregates; labels: CarryoverLabels; totalCount: number }>) {
  const currency = aggregates.dominantCurrency === null ? "" : ` ${aggregates.dominantCurrency}`;
  const items = [
    { key: "payable", label: labels.aggregate.totalPayable, amount: aggregates.totalPayable },
    { key: "paid", label: labels.aggregate.totalPaid, amount: aggregates.totalPaid },
  ].filter(item => item.amount !== null);
  if (items.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: { xs: 1.5, sm: 3 }, flexWrap: "wrap", alignItems: { sm: "flex-end" } }}
      >
        {items.map(item => (
          <Stack key={item.key} sx={{ gap: 0.25 }}>
            <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {item.label}
            </Typography>
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
              {formatAccountingMoney(item.amount)}
              {currency}
            </Typography>
          </Stack>
        ))}
        <Typography
          variant="bodyMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, marginInlineStart: { sm: "auto" } })}
        >
          {labels.aggregate.recordsCount(totalCount)}
        </Typography>
      </Stack>
    </Paper>
  );
}
