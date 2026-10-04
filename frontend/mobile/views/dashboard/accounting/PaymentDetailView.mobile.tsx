"use client";

import { EditOutlined, LockOpenOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, Stack } from "@mui/material";
import Link from "next/link";
import { PaymentDocumentPreviewShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentDocumentPreviewShared";
import { PaymentHistoryTimeline } from "@/frontend/common/views/dashboard/accounting/components/PaymentHistoryTimeline";
import type { PaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import {
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import {
  PaymentAuditFields,
  PaymentDetailFields,
  PaymentStatusCard,
} from "@/frontend/mobile/views/dashboard/accounting/PaymentDetailView.mobile.parts";
import { useAppLocale } from "@/shared/locale/localeContext";

function PaymentDetailActions(props: Readonly<{ vm: PaymentDetailViewModel }>) {
  const { t, payment, toggling, onTogglePaid } = props.vm;
  if (!payment) return null;
  return (
    <Stack direction="row" spacing={1.5}>
      <Button
        variant="outlined"
        size="small"
        startIcon={payment.isPaidStatusOn ? <LockOpenOutlined /> : <LockOutlined />}
        onClick={() => void onTogglePaid()}
        disabled={toggling}
        sx={{ flex: 1 }}
      >
        {payment.isPaidStatusOn ? t.detail.markUnpaid : t.detail.markPaid}
      </Button>
      <Button
        variant="outlined"
        size="small"
        component={Link}
        href={`/accounting/payments/${payment.id}/edit`}
        startIcon={<EditOutlined />}
        sx={{ flex: 1 }}
      >
        {t.detail.editAction}
      </Button>
    </Stack>
  );
}

export function PaymentDetailMobile(props: Readonly<PaymentDetailViewModel>) {
  const { t, payment, loading, notFound, toggleError, onDismissToggleError, canManagePayments } = props;
  const locale = useAppLocale();

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.paymentDetails} subtitle={t.pageSubtitle} />

      <MobileContentStack gap={2} paddingBottom={6}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : null}

        {notFound || (!loading && !payment) ? <Alert severity="warning">{t.empty}</Alert> : null}

        {payment ? (
          <>
            {toggleError ? (
              <MobileContentInset>
                <Alert severity="error" onClose={onDismissToggleError}>
                  {toggleError}
                </Alert>
              </MobileContentInset>
            ) : null}

            <MobileContentInset>
              <PaymentStatusCard t={t} payment={payment} />
            </MobileContentInset>

            <MobileContentInset>
              <PaymentDetailFields t={t} payment={payment} />
            </MobileContentInset>

            <MobileSectionPanel title={t.detail.historyTitle}>
              <Stack spacing={2}>
                <PaymentHistoryTimeline
                  events={payment.history ?? []}
                  labels={t.historyKinds}
                  emptyLabel={t.detail.historyEmpty}
                  locale={locale}
                />
                <PaymentAuditFields t={t} payment={payment} />
              </Stack>
            </MobileSectionPanel>

            <MobileContentInset>
              <PaymentDocumentPreviewShared labels={t.detail} invoiceId={payment.invoiceId} />
            </MobileContentInset>

            {canManagePayments ? (
              <MobileContentInset>
                <PaymentDetailActions vm={props} />
              </MobileContentInset>
            ) : null}
          </>
        ) : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
