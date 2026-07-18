"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import type { PerformanceLedgerCardLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { PerformanceLedgerCardProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { getLedgerBadgeStatus } from "@/frontend/common/views/dashboard/reports/utils/performanceLedgerStatus.utils";

export type PerformanceLedgerCardDesktopLabels = PerformanceLedgerCardLabels;

function StatCell({
  label,
  value,
  tone = "default",
}: Readonly<{ label: string; value: string | number; tone?: "default" | "error" | "primary" }>) {
  return (
    <Box sx={{ textAlign: "center", px: 1 }}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, textTransform: "uppercase" })}>
        {label}
      </Typography>
      <Typography
        variant="titleLg"
        sx={theme => {
          if (tone === "error") {
            return { color: theme.palette.error.main, fontWeight: 700 };
          }
          if (tone === "primary") {
            return { color: theme.palette.primary.main, fontWeight: 700 };
          }
          return { color: theme.palette.text.primary, fontWeight: 700 };
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

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

      <Box
        sx={{
          p: 1.5,
          display: "grid",
          gridTemplateColumns: showFinancials ? "repeat(6, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          gap: 1.5,
        }}
      >
        <StatCell label={labels.taken} value={row.taken} tone="primary" />
        <StatCell label={labels.absent} value={row.absent} tone="error" />
        <StatCell label={labels.leave} value={row.leave} />
        <StatCell label={labels.pending} value={row.pending} tone="primary" />
        {showFinancials && <StatCell label={labels.hours} value={row.hours} />}
        {showFinancials && (
          <Box
            sx={theme => ({
              textAlign: "center",
              backgroundColor: theme.palette.surfaceContainerHigh,
              borderRadius: theme.layout.radius.badge,
              p: 1,
              gridColumn: "span 1",
            })}
          >
            <Typography
              variant="labelMd"
              sx={theme => ({ color: theme.palette.primary.main, textTransform: "uppercase" })}
            >
              {labels.paid}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {paidLabel}
            </Typography>
          </Box>
        )}
      </Box>
    </BaseCard>
  );
}
