"use client";

import { Box, Typography } from "@mui/material";

export interface ConfirmSummaryDetail {
  readonly label: string;
  readonly value: string;
}

export interface ConfirmSummaryDetailsProps {
  readonly details: readonly ConfirmSummaryDetail[];
}

/**
 * Label/value summary box restating which records a confirm dialog targets.
 * Shared by the carryover and expense delete/unpay confirmations so the recap
 * markup is not cloned per dialog.
 */
export function ConfirmSummaryDetails({ details }: Readonly<ConfirmSummaryDetailsProps>) {
  return (
    <Box
      component="dl"
      sx={theme => ({
        m: 0,
        p: 2,
        display: "grid",
        gap: 1,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainerLow,
        border: `1px solid ${theme.palette.outlineVariant}`,
        "& dt, & dd": { m: 0 },
      })}
    >
      {details.map(detail => (
        <Box
          key={detail.label}
          sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}
        >
          <dt>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {detail.label}
            </Typography>
          </dt>
          <dd>
            <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
              {detail.value}
            </Typography>
          </dd>
        </Box>
      ))}
    </Box>
  );
}
