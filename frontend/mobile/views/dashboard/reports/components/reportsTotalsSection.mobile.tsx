"use client";

import { Box, Stack, Typography } from "@mui/material";
import { TotalsAmount } from "@/frontend/common/views/dashboard/reports/components/__shared__/ReportsTotalsShared";
import type { ReportsTotalsSectionProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";

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
          <TotalsAmount display={totalsDisplay} breakdownMaxWidth="100%" />
        </Stack>
      </Stack>
    </Box>
  );
}
