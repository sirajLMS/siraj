"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { BaseCard } from "@/frontend/components/ui/card/BaseCard";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { LedgerStatus, ReportLedgerRow } from "@/frontend/views/dashboard/reports/types/reportsTypes";

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
  readonly onClick?: (row: ReportLedgerRow) => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export function PerformanceLedgerCard({ row, labels, onClick }: Readonly<PerformanceLedgerCardProps>) {
  const studentText = labels.studentLabel.replace("{name}", row.studentName);
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);

  return (
    <BaseCard
      onClick={
        onClick
          ? () => {
              onClick(row);
            }
          : undefined
      }
      sx={{ p: 0, overflow: "hidden", ...(onClick ? { cursor: "pointer" } : {}) }}
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
          gridTemplateColumns: showFinancials ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
          gap: 2,
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
            })}
          >
            <Typography
              variant="labelMd"
              sx={{ color: theme => theme.palette.primary.main, textTransform: "uppercase" }}
            >
              {labels.paid}
            </Typography>
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.primary.main, fontWeight: 700 }}>
              {formatCurrency(row.paidEgp)} EGP
            </Typography>
            <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.secondary }}>
              ${formatCurrency(row.paidUsd)}
            </Typography>
          </Box>
        )}
      </Box>
    </BaseCard>
  );
}
