"use client";

import { MailOutlined } from "@mui/icons-material";
import { Box, useTheme } from "@mui/material";
import type { ManualInvoiceActionsProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceActions.types";
import { MobileExportButton, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";

export function ManualInvoiceActionsMobile({
  labels,
  canCreate,
  canSendEmail,
  isSubmitting,
  onSubmit,
  onSubmitAndSendEmail,
}: Readonly<ManualInvoiceActionsProps>) {
  const theme = useTheme();

  const submitButton = (
    <MobilePrimaryPageAction fullWidth disabled={!canCreate || isSubmitting} onClick={onSubmit} sx={{ height: 56 }}>
      {labels.submit}
    </MobilePrimaryPageAction>
  );

  const sendEmailButton = canSendEmail ? (
    <MobileExportButton
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
    </MobileExportButton>
  ) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 2 }}>
      {submitButton}
      {sendEmailButton}
    </Box>
  );
}
