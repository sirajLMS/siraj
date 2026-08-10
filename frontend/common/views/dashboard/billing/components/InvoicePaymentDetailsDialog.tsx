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
import { useEffect, useState } from "react";
import { CurrencyCode, InvoicePaymentSubmissionStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  InvoicePaymentSubmissionQuery,
  InvoicePaymentsQuery,
} from "@/frontend/common/graphql/generated/gql/operations";
import {
  approvePaymentProofMutationDocument,
  invoicePaymentSubmissionQueryDocument,
  rejectPaymentProofMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/billing-management.documents";
import { invoicePaymentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/billing-payments.documents";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { type FormatCurrencyMessages, formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/common/views/dashboard/components/FxConversionNote";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";
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
      {submission.status === InvoicePaymentSubmissionStatus.Pending ? (
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {labels.pending}
        </Typography>
      ) : null}
      {submission.status === InvoicePaymentSubmissionStatus.Rejected ? (
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
              {(() => {
                if (rejecting) {
                  return labels.rejecting;
                }
                if (showRejectConfirm) {
                  return labels.confirmReject;
                }
                return labels.reject;
              })()}
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
  readonly fxMessages: FormatCurrencyMessages;
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

function renderFxConversionNote({
  subjectUserId: targetUserId,
  viewerDisplayCurrency: viewerCurrency,
}: {
  readonly subjectUserId?: string | null;
  readonly viewerDisplayCurrency?: string | null;
}): React.ReactNode {
  if (targetUserId) {
    return <FxConversionNote mode="subject" subjectUserId={targetUserId} />;
  }
  if (viewerCurrency) {
    return <FxConversionNote mode="viewer" />;
  }
  return null;
}

function renderPaymentsOrEmpty({
  payments: paymentRows,
  locale: uiLocale,
  amountLabel: amountLabelText,
  dateLabel: dateLabelText,
  fxMessages: fxMsgs,
  submission: submissionData,
  emptyLabel: emptyLabelText,
}: {
  readonly payments: readonly PaymentRow[];
  readonly locale: string;
  readonly amountLabel: string;
  readonly dateLabel: string;
  readonly fxMessages: FormatCurrencyMessages;
  readonly submission: SubmissionRow | null;
  readonly emptyLabel: string;
}): React.ReactNode {
  if (paymentRows.length > 0) {
    return (
      <PaymentRecordsSection
        payments={paymentRows}
        locale={uiLocale}
        amountLabel={amountLabelText}
        dateLabel={dateLabelText}
        fxMessages={fxMsgs}
      />
    );
  }
  if (submissionData === null) {
    return (
      <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
        {emptyLabelText}
      </Typography>
    );
  }
  return null;
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
  readonly fxMessages: FormatCurrencyMessages;
  readonly viewerDisplayCurrency?: string | null;
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
  viewerDisplayCurrency,
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
      {renderFxConversionNote({ subjectUserId, viewerDisplayCurrency })}
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

      {renderPaymentsOrEmpty({
        payments,
        locale,
        amountLabel,
        dateLabel,
        fxMessages,
        submission,
        emptyLabel,
      })}
    </Stack>
  );
}

function useInvoicePaymentReview({
  open,
  invoiceId,
  onClose,
  onSuccess,
  billingActionsDisabled,
  canManage,
}: {
  readonly open: boolean;
  readonly invoiceId: string | null;
  readonly onClose: () => void;
  readonly onSuccess?: (action: "approve" | "reject") => void;
  readonly billingActionsDisabled: boolean;
  readonly canManage: boolean;
}) {
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
  const submissionLoadingCombined = submissionLoading || paymentsLoading;
  const loadFailed = Boolean(submissionError ?? paymentsError);
  const reviewBusy = approving || rejecting;
  const showReviewActions =
    canManage && !billingActionsDisabled && submission?.status === InvoicePaymentSubmissionStatus.Pending;

  const executeReview = async (mutation: () => Promise<unknown>, action: "approve" | "reject") => {
    if (!invoiceId || billingActionsDisabled) {
      return;
    }
    setActionError(null);
    try {
      await mutation();
      await refetchSubmission();
      await refetchPayments();
      onSuccess?.(action);
      onClose();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleApprove = () =>
    executeReview(() => {
      if (!invoiceId) return Promise.resolve();
      return approveProof({ variables: { invoiceId, expectedVersion: null } });
    }, "approve");

  const handleReject = () =>
    executeReview(() => {
      if (!invoiceId) return Promise.resolve();
      return rejectProof({
        variables: {
          invoiceId,
          rejectionReason: rejectionReason.trim() || null,
          expectedVersion: null,
        },
      });
    }, "reject");

  const handleRetryLoad = () => {
    void refetchSubmission();
    void refetchPayments();
  };

  return {
    submission,
    payments,
    loading: submissionLoadingCombined,
    loadFailed,
    reviewBusy,
    showReviewActions,
    approving,
    rejecting,
    actionError,
    rejectionReason,
    showRejectForm,
    showRejectConfirm,
    handleRetryLoad,
    handleApprove,
    handleReject,
    setRejectionReason,
    setShowRejectForm,
    setShowRejectConfirm,
  };
}

type DialogLabels = {
  readonly submissionLabels: {
    readonly pending: string;
    readonly rejected: string;
    readonly submittedAt: string;
    readonly noProof: string;
    readonly viewProof: string;
    readonly viewProofFailed: string;
  };
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
  readonly loadFailed: string;
  readonly tryAgain: string;
  readonly amount: string;
  readonly date: string;
  readonly submittedAt: string;
  readonly close: string;
  readonly empty: string;
  readonly title: string;
};

function useDialogLabels(): DialogLabels {
  const t = useAppTranslation(Translation.Dashboard.Billing).paymentDetailsDialog;
  return {
    submissionLabels: {
      pending: t.pending,
      rejected: t.rejected,
      submittedAt: t.submittedAt,
      noProof: t.noProof,
      viewProof: t.viewProof,
      viewProofFailed: t.viewProofFailed,
    },
    reviewLabels: {
      reviewActions: t.reviewActions,
      rejectionReason: t.rejectionReason,
      rejectionReasonPlaceholder: t.rejectionReasonPlaceholder,
      close: t.close,
      reject: t.reject,
      rejecting: t.rejecting,
      approve: t.approve,
      approving: t.approving,
      confirmReject: t.confirmReject,
      confirmRejectMessage: t.confirmRejectMessage,
    },
    loadFailed: t.loadFailed,
    tryAgain: t.tryAgain,
    amount: t.amount,
    date: t.date,
    submittedAt: t.submittedAt,
    close: t.close,
    empty: t.empty,
    title: t.title,
  };
}

type ReviewState = ReturnType<typeof useInvoicePaymentReview>;

type DialogHandlers = {
  readonly handleDialogClose: () => void;
  readonly handleDialogCloseFromEvent: (reason: string) => void;
  readonly onRejectionReasonChange: (value: string) => void;
  readonly onShowRejectForm: () => void;
  readonly onCancelReject: () => void;
  readonly onApprove: () => void;
  readonly onRequestReject: () => void;
  readonly onConfirmReject: () => void;
  readonly onRetryLoad: () => void;
};

function useDialogHandlers(review: ReviewState, onClose: () => void): DialogHandlers {
  const handleDialogClose = () => {
    if (review.reviewBusy) {
      return;
    }
    onClose();
  };

  const handleDialogCloseFromEvent = (reason: string) => {
    if (review.reviewBusy && (reason === "backdropClick" || reason === "escapeKeyDown")) {
      return;
    }
    handleDialogClose();
  };

  const onRejectionReasonChange = (value: string) => {
    review.setRejectionReason(value);
    review.setShowRejectConfirm(false);
  };

  const onShowRejectForm = () => review.setShowRejectForm(true);

  const onCancelReject = () => {
    review.setShowRejectForm(false);
    review.setShowRejectConfirm(false);
    review.setRejectionReason("");
  };

  const onApprove = () => {
    void review.handleApprove();
  };

  const onRequestReject = () => review.setShowRejectConfirm(true);

  const onConfirmReject = () => {
    void review.handleReject();
  };

  return {
    handleDialogClose,
    handleDialogCloseFromEvent,
    onRejectionReasonChange,
    onShowRejectForm,
    onCancelReject,
    onApprove,
    onRequestReject,
    onConfirmReject,
    onRetryLoad: review.handleRetryLoad,
  };
}

function DialogContentBody({
  review,
  handlers,
  labels,
  locale,
  fxMessages,
  subjectUserId,
  displayCurrency,
}: {
  readonly review: ReviewState;
  readonly handlers: DialogHandlers;
  readonly labels: DialogLabels;
  readonly locale: string;
  readonly fxMessages: FormatCurrencyMessages;
  readonly subjectUserId?: string | null;
  readonly displayCurrency?: string | null;
}): React.ReactNode {
  return (
    <PaymentDetailsDialogContent
      loading={review.loading}
      loadFailed={review.loadFailed}
      loadFailedLabel={labels.loadFailed}
      tryAgainLabel={labels.tryAgain}
      onRetry={handlers.onRetryLoad}
      showDisplayCurrencyHint={!displayCurrency}
      subjectUserId={subjectUserId}
      viewerDisplayCurrency={displayCurrency}
      submission={review.submission}
      payments={review.payments}
      locale={locale}
      submissionLabels={labels.submissionLabels}
      showReviewActions={review.showReviewActions}
      reviewLabels={labels.reviewLabels}
      actionError={review.actionError}
      rejectionReason={review.rejectionReason}
      showRejectForm={review.showRejectForm}
      showRejectConfirm={review.showRejectConfirm}
      reviewBusy={review.reviewBusy}
      rejecting={review.rejecting}
      approving={review.approving}
      onRejectionReasonChange={handlers.onRejectionReasonChange}
      onShowRejectForm={handlers.onShowRejectForm}
      onCancelReject={handlers.onCancelReject}
      onApprove={handlers.onApprove}
      onRequestReject={handlers.onRequestReject}
      onConfirmReject={handlers.onConfirmReject}
      amountLabel={labels.amount}
      dateLabel={labels.date}
      emptyLabel={labels.empty}
      fxMessages={fxMessages}
    />
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
  const tProfile = useAppTranslation(Translation.Profile.Base);
  const tErrors = useAppTranslation(Translation.Errors);
  const locale = useAppLocale();
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const fxMessages = buildFxDisplayMessages(
    {
      convertedAmount: tProfile.convertedAmount,
    },
    tErrors,
    {
      convertedTotalApprox: tProfile.convertedTotalApprox,
    }
  );

  const review = useInvoicePaymentReview({
    open,
    invoiceId,
    onClose,
    onSuccess,
    billingActionsDisabled,
    canManage,
  });

  const labels = useDialogLabels();
  const handlers = useDialogHandlers(review, onClose);

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => handlers.handleDialogCloseFromEvent(reason)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <DialogContentBody
          review={review}
          handlers={handlers}
          labels={labels}
          locale={locale}
          fxMessages={fxMessages}
          subjectUserId={subjectUserId}
          displayCurrency={displayCurrency}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handlers.handleDialogClose} disabled={review.reviewBusy}>
          {labels.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
