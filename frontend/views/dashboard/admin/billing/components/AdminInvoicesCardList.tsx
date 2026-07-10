"use client";

import { VisibilityOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, CircularProgress, IconButton, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  AdminInvoiceRow,
  AdminInvoiceStatus,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";

interface AdminInvoicesCardListLabels {
  readonly markAsPaid: string;
  readonly quickPay: string;
  readonly reviewSubmission: string;
  readonly viewRejection: string;
  readonly viewDetails: string;
  readonly statusLabels: Record<AdminInvoiceStatus, string>;
}

interface AdminInvoicesCardListProps {
  readonly rows: readonly AdminInvoiceRow[];
  readonly labels: AdminInvoicesCardListLabels;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly loading?: boolean;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

const StyledInvoiceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
}));

const StyledStudentAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.secondaryContainer,
  fontSize: 12,
}));

const StyledInvoiceIdLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledDateTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export function AdminInvoicesCardList({
  rows,
  labels,
  canManage,
  billingActionsDisabled = false,
  loading = false,
  onMarkAsPaid,
  onViewPaymentDetails,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<AdminInvoicesCardListProps>) {
  const pageCount = totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 1.5 }}>
      {loading ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            borderRadius: 1,
            zIndex: 1,
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : null}
      {rows.map(row => {
        const actionsEnabled = canManage && !billingActionsDisabled;
        const isPayable =
          actionsEnabled &&
          (row.status === "OVERDUE" || row.status === InvoiceStatus.Unpaid || row.status === "PENDING");
        const showViewRejection =
          actionsEnabled && row.status === InvoiceStatus.Unpaid && row.hasRejectedSubmission && onViewPaymentDetails;
        const actionLabel = row.status === "OVERDUE" ? labels.markAsPaid : labels.quickPay;

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
            {showViewRejection ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  onViewPaymentDetails({ invoiceId: row.id, parentUserId: row.parentUserId });
                }}
                sx={{ mt: 1.5, textTransform: "uppercase", fontWeight: 700 }}
              >
                {labels.viewRejection}
              </Button>
            ) : null}
            {isPayable ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  onMarkAsPaid({
                    id: row.id,
                    parentUserId: row.parentUserId,
                    amount: row.amount,
                    studentName: row.studentName,
                    dueDate: row.dueDate,
                    invoiceNumber: row.id.replace("inv-", "INV-").toUpperCase(),
                  });
                }}
                sx={{ mt: 1.5, textTransform: "uppercase", fontWeight: 700 }}
              >
                {actionLabel}
              </Button>
            ) : null}
            {row.status === InvoiceStatus.PaymentPending && actionsEnabled ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  onViewPaymentDetails?.({ invoiceId: row.id, parentUserId: row.parentUserId });
                }}
                sx={{ mt: 1.5, textTransform: "uppercase", fontWeight: 700 }}
              >
                {labels.reviewSubmission}
              </Button>
            ) : null}
            {row.status === InvoiceStatus.Paid && onViewPaymentDetails ? (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <IconButton
                  size="small"
                  aria-label={labels.viewDetails}
                  onClick={() => {
                    onViewPaymentDetails({ invoiceId: row.id, parentUserId: row.parentUserId });
                  }}
                >
                  <VisibilityOutlined fontSize="small" />
                </IconButton>
              </Box>
            ) : null}
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
