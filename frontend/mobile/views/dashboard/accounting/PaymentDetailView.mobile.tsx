"use client";

import { EditOutlined, LockOpenOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { LabeledField } from "@/frontend/common/components/ui/display";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentGatewayLabel,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { PaymentDocumentPreviewShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentDocumentPreviewShared";
import { PaymentHistoryTimeline } from "@/frontend/common/views/dashboard/accounting/components/PaymentHistoryTimeline";
import type { PaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import {
  MobileBaseCard,
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobilePersonProfileLink,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
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

function PaymentStatusCard({
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

function PaymentDetailFields({
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

function PaymentAuditFields({
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
