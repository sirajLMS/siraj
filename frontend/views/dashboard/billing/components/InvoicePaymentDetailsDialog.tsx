"use client";

import { useQuery } from "@apollo/client/react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { PaymentMethodDisplay } from "@/frontend/components/ui/display/paymentMethod/PaymentMethodDisplay";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { invoicePaymentsQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/billing-payments.documents";
import { formatLockedAmount } from "@/frontend/lib/currency";
import { snapshotToDisplayData } from "@/frontend/lib/payment-method";

export type InvoicePaymentDetailsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoiceId: string | null;
};

function formatPaymentDate(dateStr: string | null, locale: string): string {
  if (!dateStr) {
    return "—";
  }
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function InvoicePaymentDetailsDialog({
  open,
  onClose,
  invoiceId,
}: InvoicePaymentDetailsDialogProps): React.ReactNode {
  const t = useTranslations("dashboard.billing.paymentDetailsDialog");
  const locale = useLocale();

  const { data, loading } = useQuery(invoicePaymentsQueryDocument, {
    variables: { invoiceId: invoiceId ?? "" },
    skip: !open || !invoiceId,
    fetchPolicy: "network-only",
  });

  const payments = data?.invoicePayments ?? [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Stack sx={{ alignItems: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : payments.length === 0 ? (
          <Typography variant="bodyMd" sx={{ color: "text.secondary", py: 1 }}>
            {t("empty")}
          </Typography>
        ) : (
          <Stack divider={<Divider />} spacing={2} sx={{ py: 1 }}>
            {payments.map(payment => {
              const snapshot = payment.paymentMethodSnapshot;
              return (
                <Box key={payment.id ?? `${payment.paymentDate}-${payment.amount}`}>
                  <Stack spacing={1}>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {t("amount")}:{" "}
                      {formatLockedAmount(
                        payment.amount ?? "0",
                        payment.currency ?? CurrencyCode.Usd,
                        locale
                      )}
                    </Typography>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {t("date")}: {formatPaymentDate(payment.paymentDate ?? null, locale)}
                    </Typography>
                    {snapshot ? (
                      <PaymentMethodDisplay
                        method={snapshotToDisplayData(snapshot)}
                        showStatus={false}
                        compact
                      />
                    ) : null}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
