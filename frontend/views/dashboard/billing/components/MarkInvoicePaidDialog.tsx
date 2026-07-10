"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
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
import { useEffect, useState } from "react";
import { UserPaymentMethodSelect } from "@/frontend/components/ui/input/userPaymentMethodSelect";
import { PaymentDirection } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { markInvoicePaidMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { userPaymentMethodsQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { pickDefaultPayinMethod } from "@/frontend/lib/user-payment-method";
import { Link as I18nLink } from "@/shared/i18n/routing";

export type MarkInvoicePaidDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoiceId: string | null;
  readonly targetUserId: string | null;
  readonly onSuccess?: () => void;
};

export function MarkInvoicePaidDialog({
  open,
  onClose,
  invoiceId,
  targetUserId,
  onSuccess,
}: MarkInvoicePaidDialogProps): React.ReactNode {
  const t = useTranslations("dashboard.billing.markPaidDialog");
  const [selectedMethod, setSelectedMethod] = useState<UserPaymentMethodFieldsFragment | null>(null);

  const { data, loading: methodsLoading } = useQuery(userPaymentMethodsQueryDocument, {
    variables: { userId: targetUserId ?? "", direction: PaymentDirection.Payin },
    skip: !open || !targetUserId,
    fetchPolicy: "network-only",
  });

  const methods = data?.userPaymentMethods ?? [];

  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
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
  });

  const canConfirm = Boolean(invoiceId && selectedMethod?.id && methods.length > 0);

  const handleConfirm = () => {
    if (!invoiceId || !selectedMethod?.id) {
      return;
    }
    void markPaid({
      variables: {
        invoiceId,
        userPaymentMethodId: selectedMethod.id,
        expectedVersion: null,
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>
        {methodsLoading ? (
          <Stack sx={{ alignItems: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : methods.length === 0 ? (
          <Stack spacing={1.5} sx={{ py: 1 }}>
            <Typography variant="bodyMd">{t("noMethods")}</Typography>
            <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
              {t("addMethods")}
            </Typography>
            <Link component={I18nLink} href="/profile?tab=paymentMethods" underline="hover">
              {t("manageMethods")}
            </Link>
          </Stack>
        ) : (
          <UserPaymentMethodSelect
            value={selectedMethod}
            options={methods}
            setValueAction={setSelectedMethod}
            label={t("selectMethod")}
            required
            fullWidth
            disabled={submitting}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("cancel")}
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!canConfirm || submitting}>
          {submitting ? "..." : t("confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
