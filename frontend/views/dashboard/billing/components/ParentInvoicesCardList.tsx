"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import type { ParentInvoiceRow, ParentInvoiceStatus } from "@/frontend/stores/parentBillingStore";

interface ParentInvoicesCardListLabels {
  readonly viewDetails: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly statusLabels: Record<ParentInvoiceStatus, string>;
}

interface ParentInvoicesCardListProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly labels: ParentInvoicesCardListLabels;
  readonly canView: boolean;
  readonly onPayNow: (id: string) => void;
  readonly onDownloadPdf: (id: string) => void;
}

export function ParentInvoicesCardList({
  rows,
  labels,
  canView,
  onPayNow,
  onDownloadPdf,
}: Readonly<ParentInvoicesCardListProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map(row => (
        <Paper
          key={row.id}
          elevation={0}
          sx={theme => ({
            p: 2,
            borderRadius: theme.layout.radius.card,
            border: `1px solid ${theme.palette.outlineVariant}`,
            bgcolor: theme.palette.surfaceContainerLowest,
          })}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                {row.invoiceNumber}
              </Typography>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {row.month}
              </Typography>
            </Box>
            <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {row.issueDate}
            </Typography>
            <Typography variant="labelMd" sx={{ textAlign: "end", fontWeight: 700 }}>
              {row.fee}
            </Typography>
          </Box>
          {canView && row.status === "unpaid" && (
            <PrimaryPageAction
              fullWidth
              onClick={() => {
                onPayNow(row.id);
              }}
            >
              {labels.payNow}
            </PrimaryPageAction>
          )}
          {canView && row.status === "paid" && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
              <IconButton size="small" aria-label={labels.viewDetails}>
                <VisibilityOutlined fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label={labels.downloadPdf}
                onClick={() => {
                  onDownloadPdf(row.id);
                }}
              >
                <DownloadOutlined fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
}
