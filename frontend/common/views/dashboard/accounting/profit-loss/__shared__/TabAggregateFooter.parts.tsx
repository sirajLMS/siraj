"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { ExportButton } from "@/frontend/common/components/ui/button/ActionButtons";

/** Copy strings the aggregate footer renders. */
interface TabAggregateFooterLabels {
  readonly total: string;
  readonly dominant: string;
  readonly excludedRows: (count: number) => string;
  readonly exportCsv: string;
}

interface TabAggregateFooterProps {
  readonly labels: TabAggregateFooterLabels;
  /** Formatted total amount without its label, e.g. `1,250 SAR`. */
  readonly formattedTotal: string;
  readonly dominant: string | null;
  readonly excludedCount: number;
  readonly totalCount: number;
  readonly isLoading: boolean;
  /** CSV download runner; the footer toggles its own busy flag around it. */
  readonly runExport: () => Promise<{ truncated: boolean } | null>;
  readonly exportButtonId: string;
  readonly titleFontWeight?: number;
}

/**
 * Aggregate footer shared by the profit & loss revenue tabs: the month's
 * total with the dominant currency and FX-excluded row count on the left,
 * and the CSV export action on the right.
 */
export function TabAggregateFooter({
  labels,
  formattedTotal,
  dominant,
  excludedCount,
  totalCount,
  isLoading,
  runExport,
  exportButtonId,
  titleFontWeight,
}: Readonly<TabAggregateFooterProps>) {
  const [exporting, setExporting] = useState(false);

  const handleExportClick = useCallback(() => {
    const run = async () => {
      setExporting(true);
      await runExport();
      setExporting(false);
    };
    void run();
  }, [runExport]);

  return (
    <Stack
      sx={{
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="titleLg" sx={titleFontWeight === undefined ? undefined : { fontWeight: titleFontWeight }}>
          {`${labels.total}: ${formattedTotal}`}
        </Typography>
        {dominant !== null && (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {`${labels.dominant}: ${dominant}`}
          </Typography>
        )}
        {excludedCount > 0 && (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.excludedRows(excludedCount)}
          </Typography>
        )}
      </Box>
      <ExportButton
        id={exportButtonId}
        startIcon={<FileDownloadOutlined />}
        disabled={exporting || isLoading || totalCount === 0}
        onClick={handleExportClick}
      >
        {labels.exportCsv}
      </ExportButton>
    </Stack>
  );
}
