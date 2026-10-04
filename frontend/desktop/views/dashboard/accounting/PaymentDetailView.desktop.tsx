"use client";

import { Alert, Box, Stack } from "@mui/material";
import { PaymentDocumentPreviewShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentDocumentPreviewShared";
import type { PaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  PaymentDetailHeaderActions,
  PaymentDetailLoadingState,
  PaymentDetailNotFoundState,
} from "@/frontend/desktop/views/dashboard/accounting/PaymentDetailView.desktop.parts";
import {
  PaymentDetailHistorySection,
  PaymentDetailSummarySection,
} from "@/frontend/desktop/views/dashboard/accounting/PaymentDetailView.desktop.sections";

export function PaymentDetailDesktop(props: Readonly<PaymentDetailViewModel>) {
  const { t, payment, loading, notFound, toggleError, onDismissToggleError, canManagePayments } = props;

  if (loading) {
    return <PaymentDetailLoadingState />;
  }

  if (notFound || !payment) {
    return <PaymentDetailNotFoundState t={t} />;
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={`${t.paymentDetails} · ${String(payment.invoiceId ?? payment.id).slice(0, 8)}`}
        breadcrumbs={[
          { label: t.pageTitle, href: "/accounting/payments" },
          { label: String(payment.invoiceId ?? payment.id).slice(0, 8), current: true },
        ]}
        actions={canManagePayments ? <PaymentDetailHeaderActions vm={props} /> : null}
      />

      {toggleError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissToggleError}>
          {toggleError}
        </Alert>
      ) : null}

      <Stack direction="row" spacing={3} sx={{ alignItems: "stretch", flexWrap: { xs: "wrap", lg: "nowrap" } }}>
        <PaymentDetailSummarySection t={t} payment={payment} />
        <PaymentDetailHistorySection t={t} payment={payment} />
      </Stack>

      <Box sx={{ mt: 3 }}>
        <PaymentDocumentPreviewShared labels={t.detail} invoiceId={payment.invoiceId} />
      </Box>
    </DesktopPageContainer>
  );
}
