"use client";

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { ReportsTotalsSectionProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import type { ReportsTotalsDisplay } from "@/frontend/common/views/dashboard/reports/useReportsViewModel";

function TotalsAmount({ display }: { readonly display: ReportsTotalsDisplay }) {
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
            maxWidth: "100%",
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

export function ReportsTotalsSectionMobile({
  summary,
  totalsLabel,
  totalsDisplay,
  showFinancials,
}: Readonly<ReportsTotalsSectionProps>) {
  if (!showFinancials) {
    return null;
  }

  return (
    <Box
      sx={theme => ({
        px: 2,
        py: 2,
        mb: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack spacing={1}>
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {totalsLabel}
        </Typography>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {summary.totalHours}
          </Typography>
          <TotalsAmount display={totalsDisplay} />
        </Stack>
      </Stack>
    </Box>
  );
}
