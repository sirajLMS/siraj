"use client";

import { EditOutlined, LockOpenOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, CircularProgress, Divider, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentStatusTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PaymentDetailViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";
import {
  DesktopPrimaryPageAction,
  DesktopExportButton as DesktopSecondaryAction,
} from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { PaymentDocumentPreview } from "@/frontend/desktop/views/dashboard/accounting/components/PaymentDocumentPreview";
import { PaymentHistoryTimeline } from "@/frontend/desktop/views/dashboard/accounting/components/PaymentHistoryTimeline";

function DetailField({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <Box>
      <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 0.5 })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

export function PaymentDetailDesktop(props: Readonly<PaymentDetailViewModel>) {
  const { t, payment, loading, notFound, toggling, toggleError, onTogglePaid, onDismissToggleError } = props;

  if (loading) {
    return (
      <DesktopPageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={36} />
        </Box>
      </DesktopPageContainer>
    );
  }

  if (notFound || !payment) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={t.paymentDetails} />
        <Alert severity="warning">{t.empty}</Alert>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={`${t.paymentDetails} · ${String(payment.invoiceId ?? payment.id)}`}
        breadcrumbs={[
          { label: t.pageTitle, href: "/accounting/payments" },
          { label: String(payment.invoiceId ?? payment.id), current: true },
        ]}
        actions={
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
        }
      />

      {toggleError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissToggleError}>
          {toggleError}
        </Alert>
      ) : null}

      <Stack direction="row" spacing={3} sx={{ alignItems: "flex-start", flexWrap: { xs: "wrap", lg: "nowrap" } }}>
        <DesktopSectionPanel title={t.pageTitle} sx={{ flex: 2, minWidth: 320 }}>
          <Stack spacing={3}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
            >
              <Box>
                <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {t.columns.paid}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatAccountingMoney(payment.amount)}
                  </Typography>
                  <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {payment.currency}
                  </Typography>
                </Stack>
              </Box>
              <Chip
                label={payment.isPaidStatusOn ? t.status.paid : t.status.unpaid}
                color={paymentStatusTone(Boolean(payment.isPaidStatusOn))}
                variant={payment.isPaidStatusOn ? "outlined" : "filled"}
              />
            </Stack>

            <Divider />

            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", rowGap: 2 }}>
              <DetailField label={t.detail.invoiceId} value={payment.invoiceId ?? "—"} />
              <DetailField label={t.columns.paymentDate} value={formatAccountingDate(payment.paymentDate)} />
              <DetailField
                label={t.columns.studentName}
                value={
                  payment.studentId ? (
                    <MuiLink component={Link} href={`/students/${payment.studentId}/profile`} underline="hover">
                      {payment.studentName ?? payment.studentId}
                    </MuiLink>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailField label={t.detail.parent} value={payment.parentName ?? "—"} />
              <DetailField
                label={t.columns.package}
                value={payment.packageName ? `${payment.packageName} (${payment.packageCodename ?? ""})` : "—"}
              />
              <DetailField
                label={t.columns.credit}
                value={payment.creditHours ? `${Number(payment.creditHours).toFixed(2)} h` : "—"}
              />
              <DetailField
                label={t.columns.paymentGateway}
                value={payment.paymentGateway ? t.gateways[payment.paymentGateway] : "—"}
              />
              <DetailField label={t.detail.transactionRef} value={payment.transactionId ?? "—"} />
              <DetailField label={t.detail.invoiceStatus} value={payment.invoiceStatus} />
            </Stack>

            {payment.paymentNote ? (
              <>
                <Divider />
                <DetailField label={t.form.note} value={payment.paymentNote} />
              </>
            ) : null}
          </Stack>
        </DesktopSectionPanel>

        <DesktopSectionPanel title={t.detail.historyTitle} sx={{ flex: 1, minWidth: 260 }}>
          <Stack spacing={3}>
            <PaymentHistoryTimeline
              events={payment.history ?? []}
              labels={t.historyKinds}
              emptyLabel={t.detail.historyEmpty}
            />
            <Stack spacing={2}>
              <DetailField label={t.columns.createdAt} value={formatAccountingDate(payment.createdAt)} />
              <DetailField label={t.auditUpdatedAt} value={formatAccountingDate(payment.updatedAt)} />
            </Stack>
          </Stack>
        </DesktopSectionPanel>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <PaymentDocumentPreview
          title={t.detail.documentPreview}
          emptyLabel={t.detail.documentEmpty}
          downloadLabel={t.detail.downloadPdf}
          src={payment.invoiceId ? `/api/invoices/${payment.invoiceId}/download` : null}
          downloadHref={payment.invoiceId ? `/api/invoices/${payment.invoiceId}/download` : null}
        />
      </Box>
    </DesktopPageContainer>
  );
}
