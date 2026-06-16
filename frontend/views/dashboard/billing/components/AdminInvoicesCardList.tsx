"use client";

import { Avatar, Box, Button, Paper, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/components/ui";
import type { AdminInvoiceRow, AdminInvoiceStatus } from "@/frontend/stores/adminBillingStore";

interface AdminInvoicesCardListLabels {
  readonly markAsPaid: string;
  readonly quickPay: string;
  readonly statusLabels: Record<AdminInvoiceStatus, string>;
}

interface AdminInvoicesCardListProps {
  readonly rows: readonly AdminInvoiceRow[];
  readonly labels: AdminInvoicesCardListLabels;
  readonly canManage: boolean;
  readonly onMarkAsPaid: (id: string) => void;
}

export function AdminInvoicesCardList({ rows, labels, canManage, onMarkAsPaid }: Readonly<AdminInvoicesCardListProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map(row => {
        const actionLabel = row.status === "overdue" ? labels.markAsPaid : labels.quickPay;
        const showAction = canManage && row.status !== "paid";

        return (
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={theme => ({ width: 40, height: 40, bgcolor: theme.palette.secondaryContainer, fontSize: 12 })}
                >
                  {row.studentInitials}
                </Avatar>
                <Box>
                  <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                    {row.studentName}
                  </Typography>
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                    {row.id.replace("inv-", "INV-").toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {row.dateIssued}
              </Typography>
              <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                {row.amount}
              </Typography>
            </Box>
            {showAction && (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  onMarkAsPaid(row.id);
                }}
                sx={{ mt: 1.5, textTransform: "uppercase", fontWeight: 700 }}
              >
                {actionLabel}
              </Button>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
