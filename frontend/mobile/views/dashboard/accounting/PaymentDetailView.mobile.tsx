"use client";

import { EditOutlined, LockOpenOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentStatusTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

type DetailLabels = PaymentDetailViewModel["t"];
type DetailPayment = NonNullable<PaymentDetailViewModel["payment"]>;

function MobileField({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
      <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={{ fontWeight: 500, textAlign: "end" }}>
        {value}
      </Typography>
    </Stack>
  );
}

function PaymentStatusCard({
  t,
  payment,
}: Readonly<{
  t: DetailLabels;
  payment: DetailPayment;
}>) {
  return (
    <Box
      sx={theme => ({
        p: 2.5,
        borderRadius: 3,
        bgcolor: theme.palette.surfaceContainerLow,
        border: 1,
        borderColor: theme.palette.outlineVariant,
      })}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t.columns.paid}
          </Typography>
          <Chip
            size="small"
            color={paymentStatusTone(Boolean(payment.isPaidStatusOn))}
            variant={payment.isPaidStatusOn ? "outlined" : "filled"}
            label={payment.isPaidStatusOn ? t.status.paid : t.status.unpaid}
          />
        </Stack>
        <Typography variant="headlineLg" sx={{ fontWeight: 700 }}>
          {`${formatAccountingMoney(payment.amount)} ${payment.currency ?? ""}`}
        </Typography>
      </Stack>
    </Box>
  );
}

function PaymentDetailFields({
  t,
  payment,
}: Readonly<{
  t: DetailLabels;
  payment: DetailPayment;
}>) {
  return (
    <Box
      sx={theme => ({
        p: 2.5,
        borderRadius: 3,
        bgcolor: theme.palette.surfaceContainerLow,
        border: 1,
        borderColor: theme.palette.outlineVariant,
      })}
    >
      <Stack spacing={1.5}>
        <MobileField label={t.detail.invoiceId} value={payment.invoiceId ?? "—"} />
        <MobileField label={t.columns.paymentDate} value={formatAccountingDate(payment.paymentDate)} />
        <MobileField
          label={t.columns.studentName}
          value={
            payment.studentId ? (
              <Link href={`/students/${payment.studentId}/profile`} style={{ textDecoration: "none" }}>
                {payment.studentName ?? payment.studentId}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <MobileField label={t.detail.parent} value={payment.parentName ?? "—"} />
        <MobileField label={t.columns.package} value={payment.packageName ? payment.packageName : "—"} />
        <MobileField
          label={t.columns.credit}
          value={payment.creditHours ? `${Number(payment.creditHours).toFixed(2)} h` : "—"}
        />
        <MobileField
          label={t.columns.paymentGateway}
          value={payment.paymentGateway ? t.gateways[payment.paymentGateway] : "—"}
        />
        <MobileField label={t.detail.invoiceStatus} value={payment.invoiceStatus} />
      </Stack>

      {payment.paymentNote ? (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 0.5 })}>
            {t.form.note}
          </Typography>
          <Typography variant="bodyMd">{payment.paymentNote}</Typography>
        </>
      ) : null}
    </Box>
  );
}

function PaymentAuditFields({
  t,
  payment,
}: Readonly<{
  t: DetailLabels;
  payment: DetailPayment;
}>) {
  return (
    <Box
      sx={theme => ({
        p: 2.5,
        borderRadius: 3,
        bgcolor: theme.palette.surfaceContainerLow,
        border: 1,
        borderColor: theme.palette.outlineVariant,
      })}
    >
      <Stack spacing={1.5}>
        <MobileField label={t.columns.createdAt} value={formatAccountingDate(payment.createdAt)} />
        <MobileField label={t.auditUpdatedAt} value={formatAccountingDate(payment.updatedAt)} />
      </Stack>
    </Box>
  );
}

export function PaymentDetailMobile(props: Readonly<PaymentDetailViewModel>) {
  const { t, payment, loading, notFound, toggling, toggleError, onTogglePaid, onDismissToggleError } = props;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.paymentDetails} subtitle={t.pageSubtitle} />

      <Stack spacing={2} sx={{ px: 2, pb: 6 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : null}

        {notFound || (!loading && !payment) ? <Alert severity="warning">{t.empty}</Alert> : null}

        {payment ? (
          <>
            {toggleError ? (
              <Alert severity="error" onClose={onDismissToggleError}>
                {toggleError}
              </Alert>
            ) : null}

            <PaymentStatusCard t={t} payment={payment} />

            <PaymentDetailFields t={t} payment={payment} />

            <PaymentAuditFields t={t} payment={payment} />

            <Stack direction="row" spacing={1.5}>
              <Chip
                icon={payment.isPaidStatusOn ? <LockOpenOutlined /> : <LockOutlined />}
                label={payment.isPaidStatusOn ? t.detail.markUnpaid : t.detail.markPaid}
                onClick={() => void onTogglePaid()}
                disabled={toggling}
                sx={{ flex: 1, py: 2 }}
              />
              <Link href={`/accounting/payments/${payment.id}/edit`} style={{ textDecoration: "none", flex: 1 }}>
                <Chip icon={<EditOutlined />} label={t.detail.editAction} sx={{ width: "100%", py: 2 }} />
              </Link>
            </Stack>
          </>
        ) : null}
      </Stack>
    </MobilePageContainer>
  );
}
