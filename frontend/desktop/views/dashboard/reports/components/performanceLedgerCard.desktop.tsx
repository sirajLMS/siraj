"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { StatGrid } from "@/frontend/common/views/dashboard/reports/components/__shared__/PerformanceLedgerCardShared";
import type { PerformanceLedgerCardLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { PerformanceLedgerCardProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { getLedgerBadgeStatus } from "@/frontend/common/views/dashboard/reports/utils/performanceLedgerStatus.utils";

export type PerformanceLedgerCardDesktopLabels = PerformanceLedgerCardLabels;

export function PerformanceLedgerCardDesktop({
  row,
  labels,
  showFinancials,
  paidLabel,
  onClick,
}: Readonly<PerformanceLedgerCardProps>) {
  return (
    <BaseCard
      onClick={
        onClick
          ? () => {
              onClick(row);
            }
          : undefined
      }
      sx={theme => ({
        p: 0,
        overflow: "hidden",
        borderRadius: theme.layout.radius.card,
        ...(onClick ? { cursor: "pointer" } : {}),
      })}
    >
      <Box
        sx={theme => ({
          p: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          borderBottom: `1px solid ${theme.palette.border.light}`,
          backgroundColor: alpha(theme.palette.surfaceContainerLow, 0.6),
        })}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box
            sx={theme => ({
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
            })}
          >
            {row.avatarInitials}
          </Box>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {row.name}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.studentLabel(row.name)}
          </Typography>
        </Box>
        <StatusBadge
          category="sessionTracking"
          status={getLedgerBadgeStatus(row.status)}
          label={labels.statusLabels[row.status]}
          size="small"
        />
      </Box>

      <StatGrid
        labels={labels}
        values={row}
        paidDisplay={paidLabel}
        showFinancials={showFinancials}
        hasHorizontalPadding
        columns={showFinancials ? "repeat(6, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))"}
        gap={1.5}
        padding={1.5}
      />
    </BaseCard>
  );
}
