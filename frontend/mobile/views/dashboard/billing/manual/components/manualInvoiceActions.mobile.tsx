"use client";

import { MailOutlined } from "@mui/icons-material";
import { Box, useTheme } from "@mui/material";
import { ExportButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { BillingManualLabels } from "@/shared/locale";

interface ManualInvoiceActionsMobileProps {
  readonly labels: BillingManualLabels;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly onSubmit: () => void;
  readonly onSubmitAndSendEmail: () => void;
}

export function ManualInvoiceActionsMobile({
  labels,
  canCreate,
  canSendEmail,
  isSubmitting,
  onSubmit,
  onSubmitAndSendEmail,
}: Readonly<ManualInvoiceActionsMobileProps>) {
  const theme = useTheme();

  const submitButton = (
    <PrimaryPageAction fullWidth disabled={!canCreate || isSubmitting} onClick={onSubmit} sx={{ height: 56 }}>
      {labels.submit}
    </PrimaryPageAction>
  );

  const sendEmailButton = canSendEmail ? (
    <ExportButton
      fullWidth
      startIcon={<MailOutlined />}
      disabled={!canCreate || isSubmitting}
      onClick={onSubmitAndSendEmail}
      sx={{
        height: 56,
        backgroundColor: "transparent",
        color: theme.palette.primary.main,
        border: `2px solid ${theme.palette.primary.main}`,
        "&:hover": { backgroundColor: theme.palette.action.hover },
      }}
    >
      {labels.submitAndSendEmail}
    </ExportButton>
  ) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 2 }}>
      {submitButton}
      {sendEmailButton}
    </Box>
  );
}
