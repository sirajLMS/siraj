"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  approvePaymentProofMutationDocument,
  invoicePaymentSubmissionQueryDocument,
  rejectPaymentProofMutationDocument,
} from "@/frontend/graphql/sharedDocuments/billing/billing-management.documents";
import { invoicePaymentsQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/billing-payments.documents";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { getErrorMessage } from "@/shared/utils/error";

export type InvoicePaymentDetailsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoiceId: string | null;
  readonly canManage?: boolean;
  readonly onSuccess?: (action: "approve" | "reject") => void;
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

function proofFileUrl(filePath: string): string {
  return `/api/storage/files/${filePath}`;
}

function isImageMimeType(mimeType: string | null | undefined): boolean {
  return mimeType != null && mimeType.startsWith("image/");
}

export function InvoicePaymentDetailsDialog({
  open,
  onClose,
  invoiceId,
  canManage = false,
  onSuccess,
}: InvoicePaymentDetailsDialogProps): React.ReactNode {
  const t = useTranslations("dashboard.billing.paymentDetailsDialog");
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRejectionReason("");
      setShowRejectForm(false);
      setActionError(null);
    }
  }, [open]);

  const {
    data: submissionData,
    loading: submissionLoading,
    refetch: refetchSubmission,
  } = useQuery(invoicePaymentSubmissionQueryDocument, {
    variables: { invoiceId: invoiceId ?? "" },
    skip: !open || !invoiceId,
    fetchPolicy: "network-only",
  });

  const {
    data: paymentsData,
    loading: paymentsLoading,
    refetch: refetchPayments,
  } = useQuery(invoicePaymentsQueryDocument, {
    variables: { invoiceId: invoiceId ?? "" },
    skip: !open || !invoiceId,
    fetchPolicy: "network-only",
  });

  const [approveProof, { loading: approving }] = useMutation(approvePaymentProofMutationDocument);
  const [rejectProof, { loading: rejecting }] = useMutation(rejectPaymentProofMutationDocument);

  const submission = submissionData?.invoicePaymentSubmission ?? null;
  const payments = paymentsData?.invoicePayments ?? [];
  const loading = submissionLoading || paymentsLoading;
  const reviewBusy = approving || rejecting;
  const showReviewActions = canManage && submission?.status === "pending";

  const fxMessages = {
    convertedAmount: (values: {
      lockedAmount: string;
      lockedCurrency: string;
      convertedApprox: string;
      displayCurrency: string;
    }) => tProfile("convertedAmount", values),
    displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) =>
      tErrors("displayCurrencyFallback", values),
  };

  const handleApprove = async () => {
    if (!invoiceId) {
      return;
    }
    setActionError(null);
    try {
      await approveProof({ variables: { invoiceId, expectedVersion: null } });
      await refetchSubmission();
      await refetchPayments();
      onSuccess?.("approve");
      onClose();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleReject = async () => {
    if (!invoiceId) {
      return;
    }
    setActionError(null);
    try {
      await rejectProof({
        variables: {
          invoiceId,
          rejectionReason: rejectionReason.trim() || null,
          expectedVersion: null,
        },
      });
      await refetchSubmission();
      await refetchPayments();
      onSuccess?.("reject");
      onClose();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const renderProofPreview = () => {
    if (!submission?.filePath) {
      return (
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {t("noProof")}
        </Typography>
      );
    }

    const url = proofFileUrl(submission.filePath);

    if (isImageMimeType(submission.mimeType)) {
      return (
        <Box
          component="img"
          src={url}
          alt={t("viewProof")}
          sx={{ maxWidth: "100%", maxHeight: 280, borderRadius: 1, border: 1, borderColor: "outlineVariant" }}
        />
      );
    }

    return (
      <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover">
        {t("viewProof")}
      </Link>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Stack sx={{ alignItems: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ py: 1 }}>
            {submission ? (
              <Stack spacing={1.5}>
                {submission.status === "pending" ? (
                  <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
                    {t("pending")}
                  </Typography>
                ) : null}
                <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                  {t("submittedAt")}: {formatPaymentDate(submission.submittedAt ?? null, locale)}
                </Typography>
                {renderProofPreview()}
                {submission.rejectionReason ? (
                  <Typography variant="bodyMd" sx={{ color: "error.main" }}>
                    {submission.rejectionReason}
                  </Typography>
                ) : null}
              </Stack>
            ) : null}

            {showReviewActions ? (
              <Stack spacing={1.5}>
                <Typography variant="titleLg">{t("reviewActions")}</Typography>
                {actionError ? (
                  <Typography variant="bodyMd" sx={{ color: "error.main" }}>
                    {actionError}
                  </Typography>
                ) : null}
                {showRejectForm ? (
                  <TextField
                    label={t("rejectionReason")}
                    placeholder={t("rejectionReasonPlaceholder")}
                    value={rejectionReason}
                    onChange={event => {
                      setRejectionReason(event.target.value);
                    }}
                    fullWidth
                    multiline
                    minRows={2}
                    disabled={reviewBusy}
                  />
                ) : null}
                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                  {showRejectForm ? (
                    <>
                      <Button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }}
                        disabled={reviewBusy}
                      >
                        {t("close")}
                      </Button>
                      <Button
                        color="error"
                        variant="contained"
                        onClick={() => void handleReject()}
                        disabled={reviewBusy}
                      >
                        {rejecting ? t("rejecting") : t("reject")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button color="error" onClick={() => setShowRejectForm(true)} disabled={reviewBusy}>
                        {t("reject")}
                      </Button>
                      <Button variant="contained" onClick={() => void handleApprove()} disabled={reviewBusy}>
                        {t("approve")}
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            ) : null}

            {payments.length > 0 ? (
              <Stack divider={<Divider />} spacing={2}>
                {payments.map(payment => (
                  <Box key={payment.id ?? `${payment.paymentDate}-${payment.amount}`}>
                    <Stack spacing={1}>
                      <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                        {t("amount")}:{" "}
                        {formatCurrencyForDisplay(
                          payment.amount ?? "0",
                          payment.currency ?? CurrencyCode.Usd,
                          payment.displayAmount,
                          locale,
                          fxMessages
                        )}
                      </Typography>
                      <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                        {t("date")}: {formatPaymentDate(payment.paymentDate ?? null, locale)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : !submission ? (
              <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
                {t("empty")}
              </Typography>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={reviewBusy}>
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
