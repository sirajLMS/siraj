/* eslint-disable react-refresh/only-export-components */
"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, TextField } from "@mui/material";
import { FilterButton } from "@/frontend/components/ui";
import type { BillingLabels } from "@/frontend/messages/types/dashboard/billing";

interface BillingSearchBarProps {
  readonly value: string;
  readonly placeholder: string;
  readonly filterLabel: string;
  readonly onChange: (value: string) => void;
}

export function BillingSearchBar({ value, placeholder, filterLabel, onChange }: Readonly<BillingSearchBarProps>) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      <TextField
        size="small"
        value={value}
        onChange={event => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        slotProps={{ htmlInput: { autoComplete: "off" } }}
      />
      <FilterButton startIcon={<FilterListOutlined />}>{filterLabel}</FilterButton>
    </Box>
  );
}

export function getAdminInvoiceGridLabels(labels: BillingLabels) {
  return {
    invoiceId: labels.adminTable.invoiceId,
    studentName: labels.adminTable.studentName,
    dateIssued: labels.adminTable.dateIssued,
    amount: labels.adminTable.amount,
    status: labels.adminTable.status,
    actions: labels.adminTable.actions,
    markAsPaid: labels.adminTable.markAsPaid,
    quickPay: labels.adminTable.quickPay,
    noEntries: labels.adminTable.noEntries,
    statusLabels: labels.invoiceStatus,
  };
}

export function getStudentCreditGridLabels(labels: BillingLabels) {
  return {
    student: labels.creditTable.student,
    parentContact: labels.creditTable.parentContact,
    planType: labels.creditTable.planType,
    classesLeft: labels.creditTable.classesLeft,
    status: labels.creditTable.status,
    quickAction: labels.creditTable.quickAction,
    sendReminder: labels.creditTable.sendReminder,
    negativeBalance: labels.creditTable.negativeBalance,
    activeCredit: labels.creditTable.activeCredit,
    noEntries: labels.creditTable.noEntries,
    creditStatusLabels: labels.creditStatus,
  };
}

export function getParentInvoiceGridLabels(labels: BillingLabels) {
  return {
    invoiceNumber: labels.parentTable.invoiceNumber,
    month: labels.parentTable.month,
    issueDate: labels.parentTable.issueDate,
    dueDate: labels.parentTable.dueDate,
    paidDate: labels.parentTable.paidDate,
    fee: labels.parentTable.fee,
    status: labels.parentTable.status,
    options: labels.parentTable.options,
    viewDetails: labels.parentTable.viewDetails,
    downloadPdf: labels.parentTable.downloadPdf,
    payNow: labels.parentTable.payNow,
    noEntries: labels.parentTable.noEntries,
    statusLabels: labels.invoiceStatus,
  };
}
