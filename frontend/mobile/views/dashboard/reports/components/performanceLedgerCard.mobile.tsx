"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { StatGrid } from "@/frontend/common/views/dashboard/reports/components/__shared__/PerformanceLedgerCardShared";
import type { PerformanceLedgerCardLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { PerformanceLedgerCardProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { getLedgerBadgeStatus } from "@/frontend/common/views/dashboard/reports/utils/performanceLedgerStatus.utils";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

export type PerformanceLedgerCardMobileLabels = PerformanceLedgerCardLabels;

export function PerformanceLedgerCardMobile({
  row,
  labels,
  showFinancials,
  paidLabel,
  onClick,
}: Readonly<PerformanceLedgerCardProps>) {
  return (
    <MobileBaseCard
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
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          borderBottom: `1px solid ${theme.palette.border.light}`,
          backgroundColor: alpha(theme.palette.surfaceContainerLow, 0.8),
        })}
      >
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box
            sx={theme => ({
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            })}
          >
            {row.avatarInitials}
          </Box>
          <Box>
            <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {row.name}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.studentLabel(row.name)}
            </Typography>
          </Box>
        </Box>
        <MobileStatusBadge
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
        columns={showFinancials ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))"}
        gap={2}
        padding={2}
      />
    </MobileBaseCard>
  );
}
