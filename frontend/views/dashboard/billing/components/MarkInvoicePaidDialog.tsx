"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { UserPaymentMethodSelect } from "@/frontend/components/ui/input/userPaymentMethodSelect";
import { PaymentDirection } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { markInvoicePaidMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { userPaymentMethodsQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { pickDefaultPayinMethod, userPaymentMethodToOptionLabel } from "@/frontend/lib/user-payment-method";
import { useUserStore } from "@/frontend/stores/userStore";
import type { MarkPaidInvoiceTarget } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { Link as I18nLink } from "@/shared/i18n/routing";
import { getErrorMessage } from "@/shared/utils/error";

export type MarkInvoicePaidDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoice: MarkPaidInvoiceTarget | null;
  readonly onSuccess?: () => void;
  readonly onError?: (message: string) => void;
};

function InvoiceSummaryRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={{ fontWeight: 600, textAlign: "end" }}>
        {value}
      </Typography>
    </Box>
  );
}

export function MarkInvoicePaidDialog({
  open,
  onClose,
  invoice,
  onSuccess,
  onError,
}: MarkInvoicePaidDialogProps): React.ReactNode {
  const t = useTranslations("dashboard.billing.markPaidDialog");
  const tUi = useTranslations("ui.paymentMethod");
  const currentUserId = useUserStore(state => state.user?.id ?? null);
  const [selectedMethod, setSelectedMethod] = useState<UserPaymentMethodFieldsFragment | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const targetUserId = invoice?.parentUserId ?? null;
  const invoiceId = invoice?.id ?? null;

  const { data, loading: methodsLoading } = useQuery(userPaymentMethodsQueryDocument, {
    variables: { userId: targetUserId ?? "", direction: PaymentDirection.Payin },
    skip: !open || !targetUserId,
    fetchPolicy: "network-only",
  });

  const methods = data?.userPaymentMethods ?? [];

  const manageMethodsHref = useMemo(() => {
    if (!targetUserId) {
      return "/profile?tab=paymentMethods";
    }
    if (currentUserId && targetUserId === currentUserId) {
      return "/profile?tab=paymentMethods";
    }
    return `/users/${targetUserId}/profile?tab=paymentMethods`;
  }, [currentUserId, targetUserId]);

  const selectedMethodLabel = useMemo(() => {
    if (!selectedMethod) {
      return null;
    }
    return userPaymentMethodToOptionLabel(selectedMethod, key => tUi(key as never));
  }, [selectedMethod, tUi]);

  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
      setMutationError(null);
      return;
    }
    if (methods.length > 0) {
      setSelectedMethod(pickDefaultPayinMethod(methods));
    }
  }, [open, methods]);

  const [markPaid, { loading: submitting }] = useMutation(markInvoicePaidMutationDocument, {
    onCompleted: () => {
      onSuccess?.();
      onClose();
    },
    onError: error => {
      const message = getErrorMessage(error);
      setMutationError(message || t("errorGeneric"));
      onError?.(message || t("errorGeneric"));
    },
  });

  const canConfirm = Boolean(invoiceId && selectedMethod?.id && methods.length > 0 && targetUserId);

  const handleConfirm = () => {
    if (!invoiceId || !selectedMethod?.id) {
      return;
    }
    setMutationError(null);
    void markPaid({
      variables: {
        invoiceId,
        userPaymentMethodId: selectedMethod.id,
        expectedVersion: null,
      },
    });
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClose();
  };

  const showMissingParent = open && Boolean(invoice) && !targetUserId;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ py: 1 }}>
          {invoice ? (
            <Stack spacing={1} sx={{ p: 2, borderRadius: 1, bgcolor: "surfaceContainerLow" }}>
              {invoice.invoiceNumber ? (
                <InvoiceSummaryRow label={t("invoiceNumber")} value={invoice.invoiceNumber} />
              ) : null}
              {invoice.amount ? <InvoiceSummaryRow label={t("amount")} value={invoice.amount} /> : null}
              {invoice.dueDate ? <InvoiceSummaryRow label={t("dueDate")} value={invoice.dueDate} /> : null}
              {invoice.studentName ? <InvoiceSummaryRow label={t("student")} value={invoice.studentName} /> : null}
            </Stack>
          ) : null}

          {mutationError ? <Alert severity="error">{mutationError}</Alert> : null}

          {showMissingParent ? (
            <Alert severity="error">{t("missingParentUser")}</Alert>
          ) : methodsLoading ? (
            <Stack sx={{ alignItems: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : methods.length === 0 ? (
            <Stack spacing={1.5}>
              <Typography variant="bodyMd">{t("noMethods")}</Typography>
              <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
                {t("addMethods")}
              </Typography>
              {targetUserId ? (
                <Link component={I18nLink} href={manageMethodsHref} underline="hover">
                  {t("manageMethods")}
                </Link>
              ) : null}
            </Stack>
          ) : (
            <>
              <UserPaymentMethodSelect
                value={selectedMethod}
                options={methods}
                setValueAction={setSelectedMethod}
                label={t("selectMethod")}
                required
                fullWidth
                disabled={submitting}
              />
              {selectedMethodLabel && invoice?.amount ? (
                <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
                  {t("selectedMethod")}: {selectedMethodLabel} — {invoice.amount}
                </Typography>
              ) : null}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {t("cancel")}
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!canConfirm || submitting || showMissingParent}>
          {submitting ? t("confirming") : t("confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
