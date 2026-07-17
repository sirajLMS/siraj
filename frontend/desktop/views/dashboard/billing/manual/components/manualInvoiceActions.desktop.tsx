"use client";

import { SendOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { ExportButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { BillingManualLabels } from "@/shared/locale";

interface ManualInvoiceActionsDesktopProps {
  readonly labels: BillingManualLabels;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly onSubmit: () => void;
  readonly onSubmitAndSendEmail: () => void;
}

export function ManualInvoiceActionsDesktop({
  labels,
  canCreate,
  canSendEmail,
  isSubmitting,
  onSubmit,
  onSubmitAndSendEmail,
}: Readonly<ManualInvoiceActionsDesktopProps>) {
  const submitButton = (
    <PrimaryPageAction disabled={!canCreate || isSubmitting} onClick={onSubmit} sx={{ flex: 1, py: 2 }}>
      {labels.submit}
    </PrimaryPageAction>
  );

  const sendEmailButton = canSendEmail ? (
    <ExportButton
      startIcon={<SendOutlined />}
      disabled={!canCreate || isSubmitting}
      onClick={onSubmitAndSendEmail}
      sx={{ flex: 1, py: 2 }}
    >
      {labels.submitAndSendEmail}
    </ExportButton>
  ) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, pt: 3 }}>
      {submitButton}
      {sendEmailButton}
    </Box>
  );
}
