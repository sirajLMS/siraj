"use client";

import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { DeleteInvoiceDialog } from "@/frontend/views/dashboard/admin/billing/components/DeleteInvoiceDialog";
import {
  type AdminBillingViewModel,
  useAdminBillingViewModel,
} from "@/frontend/views/dashboard/admin/billing/useAdminBillingViewModel";
import { BillingImpersonationNotice } from "@/frontend/views/dashboard/billing/components/BillingImpersonationNotice";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import { SubmitPaymentProofDialog } from "@/frontend/views/dashboard/billing/components/SubmitPaymentProofDialog";

export type { AdminBillingViewModel };

const lazyBillingViews = createLazyView<AdminBillingViewModel>(
  () =>
    import("@/frontend/views/dashboard/admin/billing/mobile/adminBilling.mobile").then(m => ({
      default: m.AdminBillingMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/admin/billing/desktop/adminBilling.desktop").then(m => ({
      default: m.AdminBillingDesktopView,
    }))
);

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminBillingView() {
  const vm = useAdminBillingViewModel();
  const {
    labels,
    summaryError,
    creditError,
    invoices,
    invoicesLoading,
    invoicesError,
    refreshBillingData,
    refetchSummary,
    refetchCredit,
    canManage,
    billingActionsDisabled,
    deletingInvoice,
    onConfirmDeleteInvoice,
    onProofSuccess,
    onProofError,
    onDetailsSuccess,
    proofTarget,
    detailsTarget,
    deleteTargetId,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    onCloseSnackbar,
    onCloseProofDialog,
    onCloseDetailsDialog,
    onCloseDeleteDialog,
  } = vm;

  if (invoicesLoading && invoices.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const summaryAlert = summaryError ? (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={() => void refetchSummary()}>
          {labels.errors.retry}
        </Button>
      }
    />
  ) : null;

  const creditAlert = creditError ? (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={() => void refetchCredit()}>
          {labels.errors.retry}
        </Button>
      }
    />
  ) : null;

  if (invoicesError) {
    return (
      <>
        <BillingImpersonationNotice />
        {summaryAlert}
        {creditAlert}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 8 }}>
          <StyledErrorTypography>{labels.errors.retry}</StyledErrorTypography>
          <Button variant="outlined" onClick={refreshBillingData}>
            {labels.errors.retry}
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <BillingImpersonationNotice />
      {summaryAlert}
      {creditAlert}
      <ResponsiveViewSwitch mobile={lazyBillingViews.mobile} desktop={lazyBillingViews.desktop} props={vm} />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={onCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={onCloseSnackbar}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <SubmitPaymentProofDialog
        open={proofTarget !== null}
        onClose={onCloseProofDialog}
        invoice={proofTarget}
        mode="markPaid"
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={onProofSuccess}
        onError={onProofError}
      />
      <InvoicePaymentDetailsDialog
        open={detailsTarget !== null}
        onClose={onCloseDetailsDialog}
        invoiceId={detailsTarget?.invoiceId ?? null}
        subjectUserId={detailsTarget?.parentUserId}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={onDetailsSuccess}
      />
      <DeleteInvoiceDialog
        open={deleteTargetId !== null}
        invoiceId={deleteTargetId}
        isLoading={deletingInvoice}
        onClose={onCloseDeleteDialog}
        onConfirm={onConfirmDeleteInvoice}
      />
    </>
  );
}
