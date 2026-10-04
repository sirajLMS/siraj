"use client";

import { Divider, Stack, Typography } from "@mui/material";
import { LabeledField } from "@/frontend/common/components/ui/display";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentGatewayLabel,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import { MobileBaseCard, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { useAppLocale } from "@/shared/locale/localeContext";

type DetailLabels = PaymentDetailViewModel["t"];
type DetailPayment = NonNullable<PaymentDetailViewModel["payment"]>;

/** Truncated invoice identifier (first 8 chars) with the full value on hover/title. */
function TruncatedInvoiceId({ value }: Readonly<{ value: string }>) {
  const truncated = value.length > 8 ? `${value.slice(0, 8)}…` : value;
  return (
    <Typography
      component="span"
      sx={theme => ({
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: theme.typography.labelMd.fontSize,
      })}
      title={value}
    >
      {truncated}
    </Typography>
  );
}

export function PaymentStatusCard({
  t,
  payment,
}: Readonly<{
  t: DetailLabels;
  payment: DetailPayment;
}>) {
  return (
    <MobileBaseCard edgeToEdge={false}>
      <Stack spacing={1}>
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <MobileStatusBadge
            category="session"
            status={payment.isPaidStatusOn ? "active" : "pending"}
            label={payment.isPaidStatusOn ? t.status.paid : t.status.unpaid}
          />
        </Stack>
        <Typography variant="headlineLg" sx={{ fontWeight: 700 }}>
          {`${formatAccountingMoney(payment.amount)} ${payment.currency ?? ""}`}
        </Typography>
      </Stack>
    </MobileBaseCard>
  );
}

export function PaymentDetailFields({
  t,
  payment,
}: Readonly<{
  t: DetailLabels;
  payment: DetailPayment;
}>) {
  const locale = useAppLocale();
  return (
    <MobileBaseCard edgeToEdge={false}>
      <Stack spacing={1.5}>
        <LabeledField
          label={t.detail.invoiceId}
          value={payment.invoiceId ? <TruncatedInvoiceId value={payment.invoiceId} /> : "—"}
        />
        <LabeledField label={t.columns.paymentDate} value={formatAccountingDate(payment.paymentDate, locale)} />
        <LabeledField
          label={t.columns.studentName}
          value={
            payment.studentId ? (
              <MobilePersonProfileLink
                href={`/students/${payment.studentId}/profile`}
                name={payment.studentName ?? payment.studentId}
                avatarSize={24}
              />
            ) : (
              "—"
            )
          }
        />
        <LabeledField label={t.detail.parent} value={payment.parentName ?? "—"} />
        <LabeledField label={t.columns.package} value={payment.packageName ?? "—"} />
        <LabeledField
          label={t.columns.credit}
          value={payment.creditHours ? `${Number(payment.creditHours).toFixed(2)} h` : "—"}
        />
        <LabeledField
          label={t.columns.paymentGateway}
          value={paymentGatewayLabel(payment.paymentGateway, t.gateways)}
        />
        <LabeledField label={t.detail.invoiceStatus} value={payment.invoiceStatus} />
      </Stack>

      {payment.paymentNote ? (
        <>
          <Divider sx={{ my: 2 }} />
          <LabeledField label={t.form.note} value={payment.paymentNote} />
        </>
      ) : null}
    </MobileBaseCard>
  );
}

export function PaymentAuditFields({
  t,
  payment,
}: Readonly<{
  t: DetailLabels;
  payment: DetailPayment;
}>) {
  const locale = useAppLocale();
  return (
    <Stack spacing={1.5}>
      <LabeledField label={t.columns.createdAt} value={formatAccountingDate(payment.createdAt, locale)} />
      <LabeledField label={t.auditUpdatedAt} value={formatAccountingDate(payment.updatedAt, locale)} />
    </Stack>
  );
}
