"use client";

import { VisibilityOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/common/components/ui";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import type {
  AdminInvoiceRow,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import {
  isDeletableInvoiceStatus,
  isPayableUnpaidStatus,
  shouldShowViewRejection,
} from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";

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

export interface AdminInvoiceDesktopCardProps {
  readonly row: AdminInvoiceRow;
  readonly labels: AdminBillingViewModel["labels"];
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly billingActionsDisabled: boolean;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDeleteInvoice?: (invoiceId: string) => void;
}

export function AdminInvoiceDesktopCard({
  row,
  labels,
  canManage,
  canDelete,
  billingActionsDisabled,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDeleteInvoice,
}: Readonly<AdminInvoiceDesktopCardProps>) {
  const actionsEnabled = canManage && !billingActionsDisabled;
  const isPayable = actionsEnabled && isPayableUnpaidStatus(row.status);
  const showViewRejection =
    actionsEnabled && shouldShowViewRejection(row.status, row.hasRejectedSubmission) && onViewPaymentDetails;
  const showDelete = canDelete && !billingActionsDisabled && onDeleteInvoice && isDeletableInvoiceStatus(row.status);
  const actionLabel = row.status === "OVERDUE" ? labels.adminTable.markAsPaid : labels.adminTable.quickPay;
  const invoiceNumber = row.id.replace("inv-", "INV-").toUpperCase();

  const fullActionButtonSx = { mt: 1.5, textTransform: "uppercase", fontWeight: 700 } as const;

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <StyledStudentAvatar>{row.studentInitials}</StyledStudentAvatar>
          <Box>
            <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
              {row.studentName}
            </Typography>
            <StyledInvoiceIdLabel variant="labelMd">{invoiceNumber}</StyledInvoiceIdLabel>
          </Box>
        </Box>
        <StatusBadge category="invoice" status={row.status} label={labels.invoiceStatus[row.status]} />
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
          onClick={() => onViewPaymentDetails?.({ invoiceId: row.id, parentUserId: row.parentUserId })}
          sx={fullActionButtonSx}
        >
          {labels.adminTable.viewRejection}
        </Button>
      ) : null}
      {isPayable ? (
        <Button
          fullWidth
          variant="outlined"
          onClick={() =>
            onMarkAsPaid({
              id: row.id,
              parentUserId: row.parentUserId,
              amount: row.amount,
              studentName: row.studentName,
              dueDate: row.dueDate,
              invoiceNumber,
            })
          }
          sx={fullActionButtonSx}
        >
          {actionLabel}
        </Button>
      ) : null}
      {row.status === InvoiceStatus.PaymentPending && actionsEnabled ? (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => onViewPaymentDetails?.({ invoiceId: row.id, parentUserId: row.parentUserId })}
          sx={fullActionButtonSx}
        >
          {labels.adminTable.reviewSubmission}
        </Button>
      ) : null}
      {row.status === InvoiceStatus.Paid && onViewPaymentDetails ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <IconButton
            size="small"
            aria-label={labels.parentTable.viewDetails}
            onClick={() => onViewPaymentDetails({ invoiceId: row.id, parentUserId: row.parentUserId })}
          >
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Box>
      ) : null}
      {showDelete ? (
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={() => onDeleteInvoice?.(row.id)}
          sx={fullActionButtonSx}
        >
          {labels.adminTable.deleteInvoice}
        </Button>
      ) : null}
    </Box>
  );
}
