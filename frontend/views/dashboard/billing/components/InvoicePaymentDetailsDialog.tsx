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
import { buildFxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { type FormatCurrencyMessages, formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { useUserStore } from "@/frontend/stores/userStore";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/views/dashboard/components/FxConversionNote";
import { getErrorMessage } from "@/shared/utils/error";

export type InvoicePaymentDetailsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoiceId: string | null;
  readonly subjectUserId?: string | null;
  readonly canManage?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onSuccess?: (action: "approve" | "reject") => void;
};

type SubmissionRow = NonNullable<InvoicePaymentSubmissionQuery["invoicePaymentSubmission"]>;
type PaymentRow = NonNullable<NonNullable<InvoicePaymentsQuery["invoicePayments"]>[number]>;

type FxMessages = FormatCurrencyMessages;

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
  viewProofFailedLabel,
}: {
  readonly filePath: string | null | undefined;
  readonly mimeType: string | null | undefined;
  readonly noProofLabel: string;
  readonly viewProofLabel: string;
  readonly viewProofFailedLabel: string;
}): React.ReactNode {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, []);

  if (!filePath) {
    return (
      <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
        {noProofLabel}
      </Typography>
    );
  }

  const url = proofFileUrl(filePath);

  if (isImageMimeType(mimeType) && !imageFailed) {
    return (
      <Box
        component="img"
        src={url}
        alt={viewProofLabel}
        onError={() => setImageFailed(true)}
        sx={{ maxWidth: "100%", maxHeight: 280, borderRadius: 1, border: 1, borderColor: "outlineVariant" }}
      />
    );
  }

  if (isImageMimeType(mimeType) && imageFailed) {
    return (
      <Stack spacing={1}>
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {viewProofFailedLabel}
        </Typography>
        <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover">
          {viewProofLabel}
        </Link>
      </Stack>
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
    readonly rejected: string;
    readonly submittedAt: string;
    readonly noProof: string;
    readonly viewProof: string;
    readonly viewProofFailed: string;
  };
}): React.ReactNode {
  return (
    <Stack spacing={1.5}>
      {submission.status === "pending" ? (
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {labels.pending}
        </Typography>
      ) : null}
      {submission.status === "rejected" ? (
        <Typography variant="bodyMd" sx={{ color: "error.main" }}>
          {labels.rejected}
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
        viewProofFailedLabel={labels.viewProofFailed}
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
  showRejectConfirm,
  reviewBusy,
  rejecting,
  approving,
  onRejectionReasonChange,
  onShowRejectForm,
  onCancelReject,
  onApprove,
  onRequestReject,
  onConfirmReject,
}: {
  readonly labels: {
    readonly reviewActions: string;
    readonly rejectionReason: string;
    readonly rejectionReasonPlaceholder: string;
    readonly close: string;
    readonly reject: string;
    readonly rejecting: string;
    readonly approve: string;
    readonly approving: string;
    readonly confirmReject: string;
    readonly confirmRejectMessage: string;
  };
  readonly actionError: string | null;
  readonly rejectionReason: string;
  readonly showRejectForm: boolean;
  readonly showRejectConfirm: boolean;
  readonly reviewBusy: boolean;
  readonly rejecting: boolean;
  readonly approving: boolean;
  readonly onRejectionReasonChange: (value: string) => void;
  readonly onShowRejectForm: () => void;
  readonly onCancelReject: () => void;
  readonly onApprove: () => void;
  readonly onRequestReject: () => void;
  readonly onConfirmReject: () => void;
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
        <>
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
          {showRejectConfirm ? (
            <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
              {labels.confirmRejectMessage}
            </Typography>
          ) : null}
        </>
      ) : null}
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        {showRejectForm ? (
          <>
            <Button onClick={onCancelReject} disabled={reviewBusy}>
              {labels.close}
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={showRejectConfirm ? onConfirmReject : onRequestReject}
              disabled={reviewBusy}
            >
              {rejecting ? labels.rejecting : showRejectConfirm ? labels.confirmReject : labels.reject}
            </Button>
          </>
        ) : (
          <>
            <Button color="error" onClick={onShowRejectForm} disabled={reviewBusy}>
              {labels.reject}
            </Button>
            <Button variant="contained" onClick={onApprove} disabled={reviewBusy}>
              {approving ? labels.approving : labels.approve}
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

type PaymentDetailsContentProps = {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly loadFailedLabel: string;
  readonly tryAgainLabel: string;
  readonly onRetry: () => void;
  readonly showDisplayCurrencyHint: boolean;
  readonly subjectUserId?: string | null;
  readonly submission: SubmissionRow | null;
  readonly payments: readonly PaymentRow[];
  readonly locale: string;
  readonly submissionLabels: {
    readonly pending: string;
    readonly rejected: string;
    readonly submittedAt: string;
    readonly noProof: string;
    readonly viewProof: string;
    readonly viewProofFailed: string;
  };
  readonly showReviewActions: boolean;
  readonly reviewLabels: {
    readonly reviewActions: string;
    readonly rejectionReason: string;
    readonly rejectionReasonPlaceholder: string;
    readonly close: string;
    readonly reject: string;
    readonly rejecting: string;
    readonly approve: string;
    readonly approving: string;
    readonly confirmReject: string;
    readonly confirmRejectMessage: string;
  };
  readonly actionError: string | null;
  readonly rejectionReason: string;
  readonly showRejectForm: boolean;
  readonly showRejectConfirm: boolean;
  readonly reviewBusy: boolean;
  readonly rejecting: boolean;
  readonly approving: boolean;
  readonly onRejectionReasonChange: (value: string) => void;
  readonly onShowRejectForm: () => void;
  readonly onCancelReject: () => void;
  readonly onApprove: () => void;
  readonly onRequestReject: () => void;
  readonly onConfirmReject: () => void;
  readonly amountLabel: string;
  readonly dateLabel: string;
  readonly emptyLabel: string;
  readonly fxMessages: FxMessages;
};

function PaymentDetailsDialogContent({
  loading,
  loadFailed,
  loadFailedLabel,
  tryAgainLabel,
  onRetry,
  showDisplayCurrencyHint,
  subjectUserId,
  submission,
  payments,
  locale,
  submissionLabels,
  showReviewActions,
  reviewLabels,
  actionError,
  rejectionReason,
  showRejectForm,
  showRejectConfirm,
  reviewBusy,
  rejecting,
  approving,
  onRejectionReasonChange,
  onShowRejectForm,
  onCancelReject,
  onApprove,
  onRequestReject,
  onConfirmReject,
  amountLabel,
  dateLabel,
  emptyLabel,
  fxMessages,
}: PaymentDetailsContentProps): React.ReactNode {
  if (loading) {
    return (
      <Stack sx={{ alignItems: "center", py: 3 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (loadFailed) {
    return (
      <Stack spacing={1.5} sx={{ py: 1 }}>
        <Typography variant="bodyMd" sx={{ color: "error.main" }}>
          {loadFailedLabel}
        </Typography>
        <Button variant="outlined" onClick={onRetry}>
          {tryAgainLabel}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      {showDisplayCurrencyHint ? <DisplayCurrencyHint /> : null}
      {subjectUserId ? <FxConversionNote mode="subject" subjectUserId={subjectUserId} /> : null}
      {submission ? (
        <SubmissionDetailsSection submission={submission} locale={locale} labels={submissionLabels} />
      ) : null}

      {showReviewActions ? (
        <PaymentProofReviewActions
          labels={reviewLabels}
          actionError={actionError}
          rejectionReason={rejectionReason}
          showRejectForm={showRejectForm}
          showRejectConfirm={showRejectConfirm}
          reviewBusy={reviewBusy}
          rejecting={rejecting}
          approving={approving}
          onRejectionReasonChange={onRejectionReasonChange}
          onShowRejectForm={onShowRejectForm}
          onCancelReject={onCancelReject}
          onApprove={onApprove}
          onRequestReject={onRequestReject}
          onConfirmReject={onConfirmReject}
        />
      ) : null}

      {payments.length > 0 ? (
        <PaymentRecordsSection
          payments={payments}
          locale={locale}
          amountLabel={amountLabel}
          dateLabel={dateLabel}
          fxMessages={fxMessages}
        />
      ) : !submission ? (
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {emptyLabel}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function InvoicePaymentDetailsDialog({
  open,
  onClose,
  invoiceId,
  subjectUserId,
  canManage = false,
  billingActionsDisabled = false,
  onSuccess,
}: InvoicePaymentDetailsDialogProps): React.ReactNode {
  const t = useTranslations("dashboard.billing.paymentDetailsDialog");
  const tProfile = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRejectionReason("");
      setShowRejectForm(false);
      setShowRejectConfirm(false);
      setActionError(null);
    }
  }, [open]);

  const {
    data: submissionData,
    loading: submissionLoading,
    error: submissionError,
    refetch: refetchSubmission,
  } = useQuery(invoicePaymentSubmissionQueryDocument, {
    variables: { invoiceId: invoiceId ?? "" },
    skip: !open || !invoiceId,
    fetchPolicy: "network-only",
  });

  const {
    data: paymentsData,
    loading: paymentsLoading,
    error: paymentsError,
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
  const loadFailed = Boolean(submissionError ?? paymentsError);
  const reviewBusy = approving || rejecting;
  const showReviewActions = canManage && !billingActionsDisabled && submission?.status === "pending";

  const handleDialogClose = () => {
    if (reviewBusy) {
      return;
    }
    onClose();
  };

  const fxMessages: FxMessages = buildFxDisplayMessages(tProfile, tErrors);

  const handleApprove = async () => {
    if (!invoiceId || billingActionsDisabled) {
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
    if (!invoiceId || billingActionsDisabled) {
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

  const handleRetryLoad = () => {
    void refetchSubmission();
    void refetchPayments();
  };

  const dialogBody = (
    <PaymentDetailsDialogContent
      loading={loading}
      loadFailed={loadFailed}
      loadFailedLabel={t("loadFailed")}
      tryAgainLabel={t("tryAgain")}
      onRetry={handleRetryLoad}
      showDisplayCurrencyHint={!displayCurrency}
      subjectUserId={subjectUserId}
      submission={submission}
      payments={payments}
      locale={locale}
      submissionLabels={{
        pending: t("pending"),
        rejected: t("rejected"),
        submittedAt: t("submittedAt"),
        noProof: t("noProof"),
        viewProof: t("viewProof"),
        viewProofFailed: t("viewProofFailed"),
      }}
      showReviewActions={showReviewActions}
      reviewLabels={{
        reviewActions: t("reviewActions"),
        rejectionReason: t("rejectionReason"),
        rejectionReasonPlaceholder: t("rejectionReasonPlaceholder"),
        close: t("close"),
        reject: t("reject"),
        rejecting: t("rejecting"),
        approve: t("approve"),
        approving: t("approving"),
        confirmReject: t("confirmReject"),
        confirmRejectMessage: t("confirmRejectMessage"),
      }}
      actionError={actionError}
      rejectionReason={rejectionReason}
      showRejectForm={showRejectForm}
      showRejectConfirm={showRejectConfirm}
      reviewBusy={reviewBusy}
      rejecting={rejecting}
      approving={approving}
      onRejectionReasonChange={value => {
        setRejectionReason(value);
        setShowRejectConfirm(false);
      }}
      onShowRejectForm={() => setShowRejectForm(true)}
      onCancelReject={() => {
        setShowRejectForm(false);
        setShowRejectConfirm(false);
        setRejectionReason("");
      }}
      onApprove={() => void handleApprove()}
      onRequestReject={() => setShowRejectConfirm(true)}
      onConfirmReject={() => void handleReject()}
      amountLabel={t("amount")}
      dateLabel={t("date")}
      emptyLabel={t("empty")}
      fxMessages={fxMessages}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reviewBusy && (reason === "backdropClick" || reason === "escapeKeyDown")) {
          return;
        }
        handleDialogClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>{dialogBody}</DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} disabled={reviewBusy}>
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
