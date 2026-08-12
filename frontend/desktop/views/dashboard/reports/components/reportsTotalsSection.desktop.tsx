"use client";

import { Box, Typography } from "@mui/material";
import { TotalsAmount } from "@/frontend/common/views/dashboard/reports/components/__shared__/ReportsTotalsShared";
import type { ReportsTotalsSectionProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";

export function ReportsTotalsSectionDesktop({
  summary,
  totalsLabel,
  totalsDisplay,
  showFinancials,
}: Readonly<ReportsTotalsSectionProps>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: showFinancials
          ? "minmax(0, 1.4fr) repeat(4, 90px) 120px minmax(180px, 1fr)"
          : "minmax(0, 1.4fr) repeat(4, 90px)",
        alignItems: "center",
        px: 3,
        py: 2.5,
        backgroundColor: theme.palette.surfaceContainer,
        borderTop: `2px solid ${theme.palette.primary.main}`,
        gap: 1,
      })}
    >
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, pr: 2, textAlign: "end" })}>
        {totalsLabel}
      </Typography>
      <Box sx={{ gridColumn: "span 4" }} />
      {showFinancials && (
        <>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, textAlign: "center" })}>
            {summary.totalHours}
          </Typography>
          <Box sx={{ textAlign: "end" }}>
            <TotalsAmount display={totalsDisplay} breakdownMaxWidth={240} />
          </Box>
        </>
      )}
    </Box>
  );
}
