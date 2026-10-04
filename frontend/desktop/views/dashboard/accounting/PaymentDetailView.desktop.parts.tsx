"use client";

import { EditOutlined, LockOpenOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Stack } from "@mui/material";
import Link from "next/link";
import type { PaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import {
  DesktopPrimaryPageAction,
  DesktopExportButton as DesktopSecondaryAction,
} from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function PaymentDetailLoadingState() {
  return (
    <DesktopPageContainer>
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={36} />
      </Box>
    </DesktopPageContainer>
  );
}

export function PaymentDetailNotFoundState(props: Readonly<Pick<PaymentDetailViewModel, "t">>) {
  const { t } = props;
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.paymentDetails} />
      <Alert severity="warning">{t.empty}</Alert>
    </DesktopPageContainer>
  );
}

export function PaymentDetailHeaderActions(props: Readonly<{ vm: PaymentDetailViewModel }>) {
  const { t, payment, toggling, onTogglePaid } = props.vm;
  if (!payment) return null;
  return (
    <Stack direction="row" spacing={1.5}>
      <DesktopSecondaryAction
        startIcon={payment.isPaidStatusOn ? <LockOpenOutlined /> : <LockOutlined />}
        onClick={() => void onTogglePaid()}
        disabled={toggling}
      >
        {payment.isPaidStatusOn ? t.detail.markUnpaid : t.detail.markPaid}
      </DesktopSecondaryAction>
      <Link href={`/accounting/payments/${payment.id}/edit`} style={{ textDecoration: "none" }}>
        <DesktopPrimaryPageAction startIcon={<EditOutlined />}>{t.detail.editAction}</DesktopPrimaryPageAction>
      </Link>
    </Stack>
  );
}
