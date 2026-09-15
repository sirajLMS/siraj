"use client";

import { EditOutlined, LockOpenOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Divider, Stack, Typography } from "@mui/material";
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
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import {
  DesktopPrimaryPageAction,
  DesktopExportButton as DesktopSecondaryAction,
} from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display/personProfileLink";
import { useAppLocale } from "@/shared/locale/localeContext";

function DetailHeaderActions(props: Readonly<{ vm: PaymentDetailViewModel }>) {
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

export function PaymentDetailDesktop(props: Readonly<PaymentDetailViewModel>) {
  const { t, payment, loading, notFound, toggleError, onDismissToggleError, canManagePayments } = props;
  const locale = useAppLocale();

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
        title={`${t.paymentDetails} · ${String(payment.invoiceId ?? payment.id).slice(0, 8)}`}
        breadcrumbs={[
          { label: t.pageTitle, href: "/accounting/payments" },
          { label: String(payment.invoiceId ?? payment.id).slice(0, 8), current: true },
        ]}
        actions={canManagePayments ? <DetailHeaderActions vm={props} /> : null}
      />

      {toggleError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissToggleError}>
          {toggleError}
        </Alert>
      ) : null}

      <Stack direction="row" spacing={3} sx={{ alignItems: "stretch", flexWrap: { xs: "wrap", lg: "nowrap" } }}>
        <DesktopSectionPanel
          title={t.detail.title}
          sx={{
            flex: 2,
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            "& > :last-of-type": { flex: 1, display: "flex", flexDirection: "column" },
          }}
        >
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Stack spacing={3}>
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
              >
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatAccountingMoney(payment.amount)}
                    </Typography>
                    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                      {payment.currency}
                    </Typography>
                  </Stack>
                </Box>
                <DesktopStatusBadge
                  category="session"
                  status={payment.isPaidStatusOn ? "active" : "pending"}
                  label={payment.isPaidStatusOn ? t.status.paid : t.status.unpaid}
                />
              </Stack>

              <Divider />

              <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", rowGap: 2 }}>
                <LabeledField label={t.detail.invoiceId} value={payment.invoiceId ?? "—"} />
                <LabeledField label={t.columns.paymentDate} value={formatAccountingDate(payment.paymentDate, locale)} />
                <LabeledField
                  label={t.columns.studentName}
                  value={
                    payment.studentId ? (
                      <DesktopPersonProfileLink
                        href={`/students/${payment.studentId}/profile`}
                        name={payment.studentName ?? payment.studentId}
                        avatarSize={28}
                      />
                    ) : (
                      "—"
                    )
                  }
                />
                <LabeledField label={t.detail.parent} value={payment.parentName ?? "—"} />
                <LabeledField
                  label={t.columns.package}
                  value={payment.packageName ? `${payment.packageName} (${payment.packageCodename ?? ""})` : "—"}
                />
                <LabeledField
                  label={t.columns.credit}
                  value={payment.creditHours ? `${Number(payment.creditHours).toFixed(2)} h` : "—"}
                />
                <LabeledField
                  label={t.columns.paymentGateway}
                  value={paymentGatewayLabel(payment.paymentGateway, t.gateways)}
                />
                <LabeledField label={t.detail.transactionRef} value={payment.transactionId ?? "—"} />
                <LabeledField label={t.detail.invoiceStatus} value={payment.invoiceStatus} />
              </Stack>
            </Stack>

            {/* Pin the note to the card floor so the stretch layout leaves no dead gap above it. */}
            {payment.paymentNote ? (
              <Box sx={{ mt: "auto", pt: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <LabeledField label={t.form.note} value={payment.paymentNote} />
              </Box>
            ) : null}
          </Box>
        </DesktopSectionPanel>

        <DesktopSectionPanel title={t.detail.historyTitle} sx={{ flex: 1, minWidth: 260 }}>
          <Stack spacing={3}>
            <PaymentHistoryTimeline
              events={payment.history ?? []}
              labels={t.historyKinds}
              emptyLabel={t.detail.historyEmpty}
              locale={locale}
            />
            <Stack spacing={2}>
              <LabeledField label={t.columns.createdAt} value={formatAccountingDate(payment.createdAt, locale)} />
              <LabeledField label={t.auditUpdatedAt} value={formatAccountingDate(payment.updatedAt, locale)} />
            </Stack>
          </Stack>
        </DesktopSectionPanel>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <PaymentDocumentPreviewShared labels={t.detail} invoiceId={payment.invoiceId} />
      </Box>
    </DesktopPageContainer>
  );
}
