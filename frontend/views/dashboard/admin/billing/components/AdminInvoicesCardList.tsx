"use client";

import { Avatar, Box, Button, IconButton, Paper, Typography } from "@mui/material";
import { VisibilityOutlined } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { PaginationControls, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AdminInvoiceRow, AdminInvoiceStatus, MarkPaidInvoiceTarget } from "@/frontend/views/dashboard/billing/types/billingViewTypes";

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
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

// Invoice card with outline border and surface background for mobile card list
const StyledInvoiceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
}));

// Circular avatar with secondary container background for student initials
const StyledStudentAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.secondaryContainer,
  fontSize: 12,
}));

// Invoice ID label styled with secondary text color
const StyledInvoiceIdLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Date text styled with secondary color for subdued appearance
const StyledDateTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export function AdminInvoicesCardList({
  rows,
  labels,
  canManage,
  onMarkAsPaid,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<AdminInvoicesCardListProps>) {
  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map(row => {
        const actionLabel = row.status === "OVERDUE" ? labels.markAsPaid : labels.quickPay;
        const showAction = canManage && row.status !== InvoiceStatus.Paid;

        return (
          <StyledInvoiceCard key={row.id} elevation={0}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <StyledStudentAvatar>{row.studentInitials}</StyledStudentAvatar>
                <Box>
                  <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                    {row.studentName}
                  </Typography>
                  <StyledInvoiceIdLabel variant="labelMd">
                    {row.id.replace("inv-", "INV-").toUpperCase()}
                  </StyledInvoiceIdLabel>
                </Box>
              </Box>
              <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <StyledDateTypography variant="bodyMd">{row.dateIssued}</StyledDateTypography>
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
          </StyledInvoiceCard>
        );
      })}
      {onPageChange && totalCount !== undefined ? (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : null}
    </Box>
  );
}
