"use client";

import { Stack, Tooltip, Typography } from "@mui/material";
import type { ReportsTotalsDisplay } from "@/frontend/common/views/dashboard/reports/useReportsViewModel";

/**
 * Shared scaffold for the reports totals section.
 *
 * Desktop and mobile variants differ only in:
 *   - maxWidth of the breakdown tooltip (240 vs "100%")
 *   - outer container layout (grid vs stacked card)
 *   - `showFinancials` gating (mobile returns null when false)
 *
 * This scaffold extracts the TotalsAmount sub-component since its body
 * is identical in both tiers except for the maxWidth prop.
 */

export function TotalsAmount({
  display,
  breakdownMaxWidth = 240,
}: Readonly<{ display: ReportsTotalsDisplay; breakdownMaxWidth?: number | string }>) {
  if (!display.breakdown) {
    return (
      <Typography
        variant="bodyMd"
        sx={theme => ({ color: theme.palette.primary.main, textAlign: "end" })}
        aria-label={display.ariaLabel}
      >
        {display.primary}
      </Typography>
    );
  }

  return (
    <Stack spacing={0.25} sx={{ alignItems: "flex-end", maxWidth: "100%" }}>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, textAlign: "end" })}>
        {display.primary}
      </Typography>
      <Tooltip title={display.breakdown} arrow>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            textAlign: "end",
            maxWidth: breakdownMaxWidth,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {display.breakdown}
        </Typography>
      </Tooltip>
    </Stack>
  );
}
