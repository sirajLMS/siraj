"use client";

import { VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type {
  AdminInvoiceCardProps,
  AdminInvoiceCardSlotProps,
} from "@/frontend/common/views/dashboard/admin/billing/components/types/adminInvoiceCard.types";
import { formatInvoiceDisplayId } from "@/frontend/common/views/dashboard/billing/utils/formatInvoiceDisplayId";
import {
  isDeletableInvoiceStatus,
  isPayableUnpaidStatus,
  shouldShowViewRejection,
} from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";

const StyledInvoiceIdLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledDateTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export interface AdminInvoiceCardSharedProps {
  readonly props: Readonly<AdminInvoiceCardProps>;
  readonly slots: AdminInvoiceCardSlotProps;
}

export function AdminInvoiceCardShared({ props, slots }: Readonly<AdminInvoiceCardSharedProps>) {
  const {
    row,
    labels,
    canManage,
    canDelete,
    billingActionsDisabled,
    onMarkAsPaid,
    onViewPaymentDetails,
    onDeleteInvoice,
  } = props;
  const { StatusBadge, PersonProfileLink, ActionButton } = slots;

  const actionsEnabled = canManage && !billingActionsDisabled;
  const isPayable = actionsEnabled && isPayableUnpaidStatus(row.status);
  const showViewRejection =
    actionsEnabled && shouldShowViewRejection(row.status, row.hasRejectedSubmission) && onViewPaymentDetails;
  const showDelete = canDelete && !billingActionsDisabled && onDeleteInvoice && isDeletableInvoiceStatus(row.status);
  const actionLabel = row.status === "OVERDUE" ? labels.adminTable.markAsPaid : labels.adminTable.quickPay;
  const invoiceNumber = formatInvoiceDisplayId(row.id);

  const fullActionButtonSx = { mt: 1.5 } as const;

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box>
            <PersonProfileLink
              href={row.studentId ? studentHref(row.studentId) : undefined}
              name={row.studentName}
              avatarSize={40}
              typographyVariant="titleLg"
              fontWeight={700}
            />
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
        <ActionButton
          fullWidth
          onClick={() => onViewPaymentDetails?.({ invoiceId: row.id, parentUserId: row.parentUserId })}
          sx={fullActionButtonSx}
        >
          {labels.adminTable.viewRejection}
        </ActionButton>
      ) : null}
      {isPayable ? (
        <ActionButton
          fullWidth
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
        </ActionButton>
      ) : null}
      {row.status === "PAYMENT_PENDING" && actionsEnabled ? (
        <ActionButton
          fullWidth
          onClick={() => onViewPaymentDetails?.({ invoiceId: row.id, parentUserId: row.parentUserId })}
          sx={fullActionButtonSx}
        >
          {labels.adminTable.reviewSubmission}
        </ActionButton>
      ) : null}
      {row.status === "PAID" && onViewPaymentDetails ? (
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
        <ActionButton fullWidth color="error" onClick={() => onDeleteInvoice?.(row.id)} sx={fullActionButtonSx}>
          {labels.adminTable.deleteInvoice}
        </ActionButton>
      ) : null}
    </Box>
  );
}
