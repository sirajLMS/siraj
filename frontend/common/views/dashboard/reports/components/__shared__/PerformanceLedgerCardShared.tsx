"use client";

import { Box, Typography } from "@mui/material";

/**
 * Shared scaffold for the performance ledger card components.
 *
 * Desktop and mobile variants differ only in:
 *   - padding values (px: 1 vs none, p: 1.5 vs p: 2)
 *   - grid column count (6 vs 2/3)
 *   - avatar size (32 vs 40) and fontSize
 *   - header typography variant (bodyMd vs bodyLg)
 *   - status badge component (StatusBadge vs MobileStatusBadge)
 *   - card wrapper (BaseCard vs MobileBaseCard)
 *
 * This scaffold extracts the StatCell helper and the financial PaidCell
 * so both tiers share the same presentational inner content.
 */

function StatCell({
  label,
  value,
  tone = "default",
  hasHorizontalPadding = false,
}: Readonly<{
  label: string;
  value: string | number;
  tone?: "default" | "error" | "primary";
  hasHorizontalPadding?: boolean;
}>) {
  return (
    <Box sx={{ textAlign: "center", px: hasHorizontalPadding ? 1 : 0 }}>
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

function PaidCell({ paidLabel, label }: Readonly<{ paidLabel: string; label: string }>) {
  return (
    <Box
      sx={theme => ({
        textAlign: "center",
        backgroundColor: theme.palette.surfaceContainerHigh,
        borderRadius: theme.layout.radius.badge,
        p: 1,
      })}
    >
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, textTransform: "uppercase" })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
        {paidLabel}
      </Typography>
    </Box>
  );
}

export function StatGrid({
  labels,
  values,
  paidDisplay,
  showFinancials,
  hasHorizontalPadding = false,
  columns,
  gap,
  padding,
}: Readonly<{
  labels: { taken: string; absent: string; leave: string; pending: string; hours: string; paid: string };
  values: { taken: number; absent: number; leave: number; pending: number; hours: string };
  paidDisplay: string;
  showFinancials: boolean;
  hasHorizontalPadding?: boolean;
  columns: string;
  gap: number;
  padding: number;
}>) {
  return (
    <Box
      sx={{
        p: padding,
        display: "grid",
        gridTemplateColumns: columns,
        gap,
      }}
    >
      <StatCell label={labels.taken} value={values.taken} tone="primary" hasHorizontalPadding={hasHorizontalPadding} />
      <StatCell label={labels.absent} value={values.absent} tone="error" hasHorizontalPadding={hasHorizontalPadding} />
      <StatCell label={labels.leave} value={values.leave} hasHorizontalPadding={hasHorizontalPadding} />
      <StatCell
        label={labels.pending}
        value={values.pending}
        tone="primary"
        hasHorizontalPadding={hasHorizontalPadding}
      />
      {showFinancials && (
        <StatCell label={labels.hours} value={values.hours} hasHorizontalPadding={hasHorizontalPadding} />
      )}
      {showFinancials && <PaidCell paidLabel={paidDisplay} label={labels.paid} />}
    </Box>
  );
}
