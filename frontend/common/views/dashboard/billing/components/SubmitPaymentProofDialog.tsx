"use client";

import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { UploadType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  markInvoicePaidMutationDocument,
  submitPaymentProofMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/billing-management.documents";
import { prepareUploadMutationDocument } from "@/frontend/common/graphql/sharedDocuments/resources/learning-resource.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import {
  isAllowedPaymentProofMimeType,
  MAX_PAYMENT_PROOF_FILE_SIZE_BYTES,
  PAYMENT_PROOF_ACCEPT,
} from "@/shared/constants/billing/payment-proof";
import { useAppTranslation } from "@/shared/locale/client";
import { getErrorMessage } from "@/shared/utils/error";
import { extToMime } from "@/shared/utils/storage.utils";

export type SubmitPaymentProofDialogMode = "submit" | "markPaid";

export type SubmitPaymentProofDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoice: MarkPaidInvoiceTarget | null;
  readonly mode: SubmitPaymentProofDialogMode;
  readonly billingActionsDisabled?: boolean;
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

async function computeContentHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = "";
  for (const byte of hashArray) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

function resolveProofContentType(file: File): string | null {
  if (file.type && isAllowedPaymentProofMimeType(file.type)) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = extToMime[ext];
  if (mime && isAllowedPaymentProofMimeType(mime)) {
    return mime;
  }
  return null;
}

function resetFileInput(fileInputRef: React.RefObject<HTMLInputElement | null>): void {
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
}

function validatePaymentProofFile(
  file: File,
  labels: { fileTooLarge: (values: { maxMb: number }) => string; invalidFileType: string }
): { ok: true; contentType: string } | { ok: false; error: string } {
  if (file.size > MAX_PAYMENT_PROOF_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: labels.fileTooLarge({ maxMb: Math.floor(MAX_PAYMENT_PROOF_FILE_SIZE_BYTES / (1024 * 1024)) }),
    };
  }

  const contentType = resolveProofContentType(file);
  if (!contentType) {
    return { ok: false, error: labels.invalidFileType };
  }

  return { ok: true, contentType };
}

async function uploadProofToStorage(
  selectedFile: File,
  invoiceId: string,
  contentType: string,
  contentHash: string,
  prepareUpload: (options: {
    variables: { input: { path: string; fileSize: number; contentType: string; contentHash: string } };
  }) => Promise<{ data?: { prepareUpload?: { id: string; url: string; uploadType: UploadType } | null } }>
): Promise<{ fileId: string } | { error: "uploadPrepareFailed" | "uploadFailed" }> {
  const filePath = `payment-proofs/${invoiceId}/${selectedFile.name}`;

  const { data: prepData } = await prepareUpload({
    variables: {
      input: {
        path: filePath,
        fileSize: selectedFile.size,
        contentType,
        contentHash,
      },
    },
  });

  if (!prepData?.prepareUpload) {
    return { error: "uploadPrepareFailed" };
  }

  const { id: fileId, url, uploadType } = prepData.prepareUpload;

  if (uploadType === UploadType.VercelBlobClient) {
    const { upload } = await import("@vercel/blob/client");
    await upload(filePath, selectedFile, {
      access: "public",
      handleUploadUrl: url,
      clientPayload: JSON.stringify({
        sessionId: fileId,
        fileSize: selectedFile.size,
        contentType,
      }),
    });
    return { fileId };
  }

  const putResponse = await fetch(url, {
    method: "PUT",
    body: selectedFile,
    headers: {
      "Content-Type": contentType,
      "Content-MD5": contentHash,
    },
  });

  if (!putResponse.ok) {
    logger.error("Payment proof upload failed", { status: putResponse.status });
    return { error: "uploadFailed" };
  }

  return { fileId };
}

type SubmitProofMutation = (options: {
  variables: { invoiceId: string; proofFileId: string; expectedVersion: null };
}) => Promise<unknown>;

async function executeProofSubmission(params: {
  selectedFile: File;
  invoiceId: string;
  mode: SubmitPaymentProofDialogMode;
  prepareUploadMutation: (options: {
    variables: { input: { path: string; fileSize: number; contentType: string; contentHash: string } };
  }) => Promise<{ data?: { prepareUpload?: { id: string; url: string; uploadType: UploadType } | null } }>;
  submitProof: SubmitProofMutation;
  markPaid: SubmitProofMutation;
  labels: { invalidFileType: string; uploadPrepareFailed: string; uploadFailed: string };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const contentType = resolveProofContentType(params.selectedFile);
  if (!contentType) {
    return { ok: false, error: params.labels.invalidFileType };
  }

  const contentHash = await computeContentHash(params.selectedFile);
  const uploadResult = await uploadProofToStorage(
    params.selectedFile,
    params.invoiceId,
    contentType,
    contentHash,
    options => params.prepareUploadMutation(options)
  );

  if ("error" in uploadResult) {
    return { ok: false, error: params.labels[uploadResult.error] };
  }

  const mutation = params.mode === "submit" ? params.submitProof : params.markPaid;
  await mutation({
    variables: {
      invoiceId: params.invoiceId,
      proofFileId: uploadResult.fileId,
      expectedVersion: null,
    },
  });

  return { ok: true };
}

function SubmitPaymentProofDialogBody({
  invoice,
  busy,
  mutationError,
  selectedFileName,
  labels,
  fileInputRef,
  onFileChange,
}: {
  readonly invoice: MarkPaidInvoiceTarget | null;
  readonly busy: boolean;
  readonly mutationError: string | null;
  readonly selectedFileName: string | null;
  readonly labels: {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    student: string;
    selectFile: string;
    fileHint: string;
  };
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}): React.ReactNode {
  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      {invoice ? (
        <Stack spacing={1} sx={{ p: 2, borderRadius: 1, bgcolor: "surfaceContainerLow" }}>
          {invoice.invoiceNumber ? (
            <InvoiceSummaryRow label={labels.invoiceNumber} value={invoice.invoiceNumber} />
          ) : null}
          {invoice.amount ? <InvoiceSummaryRow label={labels.amount} value={invoice.amount} /> : null}
          {invoice.dueDate ? <InvoiceSummaryRow label={labels.dueDate} value={invoice.dueDate} /> : null}
          {invoice.studentName ? <InvoiceSummaryRow label={labels.student} value={invoice.studentName} /> : null}
        </Stack>
      ) : null}

      {mutationError ? <Alert severity="error">{mutationError}</Alert> : null}

      <Stack spacing={1}>
        <Typography variant="labelMd">{labels.selectFile}</Typography>
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {labels.fileHint}
        </Typography>
        <Button variant="outlined" component="label" disabled={busy}>
          {selectedFileName ?? labels.selectFile}
          <input ref={fileInputRef} type="file" hidden accept={PAYMENT_PROOF_ACCEPT} onChange={onFileChange} />
        </Button>
      </Stack>

      {busy ? (
        <Stack sx={{ alignItems: "center", py: 1 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}
    </Stack>
  );
}

export function SubmitPaymentProofDialog({
  open,
  onClose,
  invoice,
  mode,
  billingActionsDisabled = false,
  onSuccess,
  onError,
}: SubmitPaymentProofDialogProps): React.ReactNode {
  const t = useAppTranslation().dashboardTranslations.billing.submitProofDialog;
  const tErrors = useAppTranslation().errorsTranslations;
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invoiceId = invoice?.id ?? null;
  const busy = uploading;

  const [prepareUploadMutation] = useMutation(prepareUploadMutationDocument);
  const [submitProof] = useMutation(submitPaymentProofMutationDocument);
  const [markPaid] = useMutation(markInvoicePaidMutationDocument);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setMutationError(null);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleClose = () => {
    if (busy) {
      return;
    }
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMutationError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validatePaymentProofFile(file, {
      fileTooLarge: values => t.fileTooLarge(values.maxMb),
      invalidFileType: t.invalidFileType,
    });
    if (!validation.ok) {
      setSelectedFile(null);
      setMutationError(validation.error);
      resetFileInput(fileInputRef);
      return;
    }

    setSelectedFile(file);
  };

  const handleConfirm = async () => {
    if (!invoiceId || !selectedFile) {
      return;
    }

    if (billingActionsDisabled) {
      const message = tErrors.auth.impersonationNotAllowedDuringSession;
      setMutationError(message);
      onError?.(message);
      return;
    }

    setMutationError(null);
    setUploading(true);

    try {
      const result = await executeProofSubmission({
        selectedFile,
        invoiceId,
        mode,
        prepareUploadMutation: options => prepareUploadMutation(options),
        submitProof: options => submitProof(options),
        markPaid: options => markPaid(options),
        labels: {
          invalidFileType: t.invalidFileType,
          uploadPrepareFailed: t.uploadPrepareFailed,
          uploadFailed: t.uploadFailed,
        },
      });

      if (!result.ok) {
        setMutationError(result.error);
        onError?.(result.error);
        return;
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error) || t.errorGeneric;
      setMutationError(message);
      onError?.(message);
    } finally {
      setUploading(false);
    }
  };

  const title = mode === "submit" ? t.titleSubmit : t.titleMarkPaid;
  const confirmLabel = mode === "markPaid" && !busy ? t.confirmMarkPaid : busy ? t.confirming : t.confirm;
  const canConfirm = Boolean(invoiceId && selectedFile && !busy && !billingActionsDisabled);

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (busy && (reason === "backdropClick" || reason === "escapeKeyDown")) {
          return;
        }
        handleClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {billingActionsDisabled && open ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t.impersonationBlocked}
          </Alert>
        ) : null}
        {!displayCurrency ? <DisplayCurrencyHint /> : null}
        <SubmitPaymentProofDialogBody
          invoice={invoice}
          busy={busy}
          mutationError={mutationError}
          selectedFileName={selectedFile?.name ?? null}
          labels={{
            invoiceNumber: t.invoiceNumber,
            amount: t.amount,
            dueDate: t.dueDate,
            student: t.student,
            selectFile: t.selectFile,
            fileHint: t.fileHint,
          }}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          {t.cancel}
        </Button>
        <Button variant="contained" onClick={() => void handleConfirm()} disabled={!canConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
