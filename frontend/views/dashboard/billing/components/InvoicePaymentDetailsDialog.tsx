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
import type { InvoicePaymentSubmissionQuery, InvoicePaymentsQuery } from "@/frontend/graphql/generated/gql/operations";
import {
  approvePaymentProofMutationDocument,
  invoicePaymentSubmissionQueryDocument,
  rejectPaymentProofMutationDocument,
} from "@/frontend/graphql/sharedDocuments/billing/billing-management.documents";
import { invoicePaymentsQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/billing-payments.documents";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { useUserStore } from "@/frontend/stores/userStore";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { getErrorMessage } from "@/shared/utils/error";

export type InvoicePaymentDetailsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoiceId: string | null;
  readonly canManage?: boolean;
  readonly onSuccess?: (action: "approve" | "reject") => void;
};

type SubmissionRow = NonNullable<InvoicePaymentSubmissionQuery["invoicePaymentSubmission"]>;
type PaymentRow = NonNullable<NonNullable<InvoicePaymentsQuery["invoicePayments"]>[number]>;

type FxMessages = {
  readonly convertedAmount: (values: {
    lockedAmount: string;
    lockedCurrency: string;
    convertedApprox: string;
    displayCurrency: string;
  }) => string;
  readonly displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) => string;
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
  return mimeType?.startsWith("image/") ?? false;
}

function PaymentProofPreview({
  filePath,
  mimeType,
  noProofLabel,
  viewProofLabel,
}: {
  readonly filePath: string | null | undefined;
  readonly mimeType: string | null | undefined;
  readonly noProofLabel: string;
  readonly viewProofLabel: string;
}): React.ReactNode {
  if (!filePath) {
    return (
      <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
        {noProofLabel}
      </Typography>
    );
  }

  const url = proofFileUrl(filePath);

  if (isImageMimeType(mimeType)) {
    return (
      <Box
        component="img"
        src={url}
        alt={viewProofLabel}
        sx={{ maxWidth: "100%", maxHeight: 280, borderRadius: 1, border: 1, borderColor: "outlineVariant" }}
      />
    );
  }

  return (
    <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover">
      {viewProofLabel}
    </Link>
  );
}

function SubmissionDetailsSection({
  submission,
  locale,
  labels,
}: {
  readonly submission: SubmissionRow;
  readonly locale: string;
  readonly labels: {
    readonly pending: string;
    readonly submittedAt: string;
    readonly noProof: string;
    readonly viewProof: string;
  };
}): React.ReactNode {
  return (
    <Stack spacing={1.5}>
      {submission.status === "pending" ? (
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {labels.pending}
        </Typography>
      ) : null}
      <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
        {labels.submittedAt}: {formatPaymentDate(submission.submittedAt ?? null, locale)}
      </Typography>
      <PaymentProofPreview
        filePath={submission.filePath}
        mimeType={submission.mimeType}
        noProofLabel={labels.noProof}
        viewProofLabel={labels.viewProof}
      />
      {submission.rejectionReason ? (
        <Typography variant="bodyMd" sx={{ color: "error.main" }}>
          {submission.rejectionReason}
        </Typography>
      ) : null}
    </Stack>
  );
}

function PaymentProofReviewActions({
  labels,
  actionError,
  rejectionReason,
  showRejectForm,
  reviewBusy,
  rejecting,
  onRejectionReasonChange,
  onShowRejectForm,
  onCancelReject,
  onApprove,
  onReject,
}: {
  readonly labels: {
    readonly reviewActions: string;
    readonly rejectionReason: string;
    readonly rejectionReasonPlaceholder: string;
    readonly close: string;
    readonly reject: string;
    readonly rejecting: string;
    readonly approve: string;
  };
  readonly actionError: string | null;
  readonly rejectionReason: string;
  readonly showRejectForm: boolean;
  readonly reviewBusy: boolean;
  readonly rejecting: boolean;
  readonly onRejectionReasonChange: (value: string) => void;
  readonly onShowRejectForm: () => void;
  readonly onCancelReject: () => void;
  readonly onApprove: () => void;
  readonly onReject: () => void;
}): React.ReactNode {
  return (
    <Stack spacing={1.5}>
      <Typography variant="titleLg">{labels.reviewActions}</Typography>
      {actionError ? (
        <Typography variant="bodyMd" sx={{ color: "error.main" }}>
          {actionError}
        </Typography>
      ) : null}
      {showRejectForm ? (
        <TextField
          label={labels.rejectionReason}
          placeholder={labels.rejectionReasonPlaceholder}
          value={rejectionReason}
          onChange={event => {
            onRejectionReasonChange(event.target.value);
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
            <Button onClick={onCancelReject} disabled={reviewBusy}>
              {labels.close}
            </Button>
            <Button color="error" variant="contained" onClick={onReject} disabled={reviewBusy}>
              {rejecting ? labels.rejecting : labels.reject}
            </Button>
          </>
        ) : (
          <>
            <Button color="error" onClick={onShowRejectForm} disabled={reviewBusy}>
              {labels.reject}
            </Button>
            <Button variant="contained" onClick={onApprove} disabled={reviewBusy}>
              {labels.approve}
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
}

function PaymentRecordsSection({
  payments,
  locale,
  amountLabel,
  dateLabel,
  fxMessages,
}: {
  readonly payments: readonly PaymentRow[];
  readonly locale: string;
  readonly amountLabel: string;
  readonly dateLabel: string;
  readonly fxMessages: FxMessages;
}): React.ReactNode {
  return (
    <Stack divider={<Divider />} spacing={2}>
      {payments.map(payment => (
        <Box key={payment.id ?? `${payment.paymentDate}-${payment.amount}`}>
          <Stack spacing={1}>
            <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
              {amountLabel}:{" "}
              {formatCurrencyForDisplay(
                payment.amount ?? "0",
                payment.currency ?? CurrencyCode.Usd,
                payment.displayAmount,
                locale,
                fxMessages
              )}
            </Typography>
            <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
              {dateLabel}: {formatPaymentDate(payment.paymentDate ?? null, locale)}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
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
  const displayCurrency = useUserStore(state => state.displayCurrency);
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

  const fxMessages: FxMessages = {
    convertedAmount: values => tProfile("convertedAmount", values),
    displayCurrencyFallback: values => tErrors("displayCurrencyFallback", values),
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

  const dialogBody = loading ? (
    <Stack sx={{ alignItems: "center", py: 3 }}>
      <CircularProgress size={28} />
    </Stack>
  ) : (
    <Stack spacing={2} sx={{ py: 1 }}>
      {!displayCurrency ? <DisplayCurrencyHint /> : null}
      {submission ? (
        <SubmissionDetailsSection
          submission={submission}
          locale={locale}
          labels={{
            pending: t("pending"),
            submittedAt: t("submittedAt"),
            noProof: t("noProof"),
            viewProof: t("viewProof"),
          }}
        />
      ) : null}

      {showReviewActions ? (
        <PaymentProofReviewActions
          labels={{
            reviewActions: t("reviewActions"),
            rejectionReason: t("rejectionReason"),
            rejectionReasonPlaceholder: t("rejectionReasonPlaceholder"),
            close: t("close"),
            reject: t("reject"),
            rejecting: t("rejecting"),
            approve: t("approve"),
          }}
          actionError={actionError}
          rejectionReason={rejectionReason}
          showRejectForm={showRejectForm}
          reviewBusy={reviewBusy}
          rejecting={rejecting}
          onRejectionReasonChange={setRejectionReason}
          onShowRejectForm={() => setShowRejectForm(true)}
          onCancelReject={() => {
            setShowRejectForm(false);
            setRejectionReason("");
          }}
          onApprove={() => void handleApprove()}
          onReject={() => void handleReject()}
        />
      ) : null}

      {payments.length > 0 ? (
        <PaymentRecordsSection
          payments={payments}
          locale={locale}
          amountLabel={t("amount")}
          dateLabel={t("date")}
          fxMessages={fxMessages}
        />
      ) : !submission ? (
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {t("empty")}
        </Typography>
      ) : null}
    </Stack>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>{dialogBody}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={reviewBusy}>
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
