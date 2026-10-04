"use client";

import { Box, Stack, type SxProps, type Theme, Typography } from "@mui/material";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";

export const SUMMARY_TABLE_SX: SxProps<Theme> = theme => ({
  width: "100%",
  borderCollapse: "collapse",
  "& th": {
    pb: 1.5,
    px: 1.5,
    textAlign: "start",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& td": {
    py: 1.5,
    px: 1.5,
    textAlign: "end",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& th:last-child, & td:last-child": { px: 0 },
  "& tr:last-child th, & tr:last-child td": { borderBottom: "none" },
});

interface SummaryRowProps {
  /** Row header, rendered in a scope="row" cell so screen readers announce it per value. */
  readonly label: string;
  readonly amount: string | null;
  readonly currency: string;
  /** Sign-aware styling; defaults to the surface text color. */
  readonly colorSx?: (theme: Theme) => { color: string };
  /** Secondary figure shown beside the amount (the margin percentage on the Net Profit row). */
  readonly trailing?: string;
  /** Extra context announced to assistive tech alongside the amount. */
  readonly ariaLabel?: string;
}

export function SummaryRow({ label, amount, currency, colorSx, trailing, ariaLabel }: Readonly<SummaryRowProps>) {
  return (
    <Box component="tr">
      <Box component="th" scope="row">
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {label}
        </Typography>
      </Box>
      <Box component="td">
        <Stack direction="row" sx={{ justifyContent: "flex-end", alignItems: "baseline", gap: 1 }}>
          {trailing !== undefined ? (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {trailing}
            </Typography>
          ) : null}
          <Typography
            variant="titleLg"
            sx={theme => (colorSx ? colorSx(theme) : { color: theme.palette.onSurface })}
            aria-label={ariaLabel}
          >
            {`${formatAccountingMoney(amount)} ${currency}`}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
