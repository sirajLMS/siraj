"use client";

import { MailOutlined, SendOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { ExportButton, PrimaryPageAction } from "@/frontend/components/ui";
import type { BillingManualLabels } from "@/frontend/messages/types/dashboard/billing/manual";

interface ManualInvoiceActionsProps {
  readonly labels: BillingManualLabels;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly variant: "desktop" | "mobile";
  readonly onSubmit: () => void;
  readonly onSubmitAndSendEmail: () => void;
}

export function ManualInvoiceActions({
  labels,
  canCreate,
  canSendEmail,
  isSubmitting,
  variant,
  onSubmit,
  onSubmitAndSendEmail,
}: Readonly<ManualInvoiceActionsProps>) {
  const isMobile = variant === "mobile";

  const submitButton = (
    <PrimaryPageAction
      fullWidth={isMobile}
      disabled={!canCreate || isSubmitting}
      onClick={onSubmit}
      sx={isMobile ? { height: 56 } : { flex: 1, py: 2 }}
    >
      {labels.submit}
    </PrimaryPageAction>
  );

  const sendEmailButton = canSendEmail ? (
    <ExportButton
      fullWidth={isMobile}
      startIcon={isMobile ? <MailOutlined /> : <SendOutlined />}
      disabled={!canCreate || isSubmitting}
      onClick={onSubmitAndSendEmail}
      sx={
        isMobile
          ? {
              height: 56,
              bgcolor: "transparent",
              color: theme => theme.palette.primary.main,
              border: theme => `2px solid ${theme.palette.primary.main}`,
              "&:hover": { bgcolor: theme => theme.palette.action.hover },
            }
          : { flex: 1, py: 2 }
      }
    >
      {labels.submitAndSendEmail}
    </ExportButton>
  ) : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : { xs: "column", sm: "row" },
        gap: isMobile ? 1.5 : 2,
        pt: isMobile ? 2 : 3,
      }}
    >
      {submitButton}
      {sendEmailButton}
    </Box>
  );
}
