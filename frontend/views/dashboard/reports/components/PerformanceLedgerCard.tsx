"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui/BaseCard";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { LedgerStatus, ReportLedgerRow } from "@/frontend/stores/reportsStore";

interface PerformanceLedgerCardLabels {
  readonly studentLabel: string;
  readonly paid: string;
  readonly statusLabels: Record<LedgerStatus, string>;
  readonly taken: string;
  readonly absent: string;
  readonly leave: string;
  readonly pending: string;
  readonly hours: string;
}

interface PerformanceLedgerCardProps {
  readonly row: ReportLedgerRow;
  readonly labels: PerformanceLedgerCardLabels;
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStatusBadgeStatus(status: LedgerStatus): string {
  if (status === "active") {
    return "regular";
  }
  return "on_leave";
}

function StatCell({
  label,
  value,
  tone = "default",
}: Readonly<{ label: string; value: string | number; tone?: "default" | "error" | "primary" }>) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.secondary, textTransform: "uppercase" }}>
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

export function PerformanceLedgerCard({ row, labels }: Readonly<PerformanceLedgerCardProps>) {
  const studentText = labels.studentLabel.replace("{name}", row.studentName);

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={theme => ({
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          borderBottom: `1px solid ${theme.palette.border.light}`,
          bgcolor: alpha(theme.palette.surfaceContainerLow, 0.8),
        })}
      >
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box
            sx={theme => ({
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: theme.palette.primary.main,
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
            <Typography variant="bodyLg" sx={{ color: theme => theme.palette.primary.main, fontWeight: 700 }}>
              {row.name}
            </Typography>
            <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {studentText}
            </Typography>
          </Box>
        </Box>
        <StatusBadge
          category="sessionTracking"
          status={getStatusBadgeStatus(row.status)}
          label={labels.statusLabels[row.status]}
          size="small"
        />
      </Box>

      <Box
        sx={{
          p: 2,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 2,
        }}
      >
        <StatCell label={labels.taken} value={row.taken} tone="primary" />
        <StatCell label={labels.absent} value={row.absent} tone="error" />
        <StatCell label={labels.leave} value={row.leave} />
        <StatCell label={labels.pending} value={row.pending} tone="primary" />
        <StatCell label={labels.hours} value={row.hours} />
        <Box
          sx={theme => ({
            textAlign: "center",
            bgcolor: theme.palette.surfaceContainerHigh,
            borderRadius: theme.layout.radius.badge,
            p: 1,
          })}
        >
          <Typography variant="labelMd" sx={{ color: theme => theme.palette.primary.main, textTransform: "uppercase" }}>
            {labels.paid}
          </Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.primary.main, fontWeight: 700 }}>
            {formatCurrency(row.paidEgp)} EGP
          </Typography>
          <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.secondary }}>
            ${formatCurrency(row.paidUsd)}
          </Typography>
        </Box>
      </Box>
    </BaseCard>
  );
}
