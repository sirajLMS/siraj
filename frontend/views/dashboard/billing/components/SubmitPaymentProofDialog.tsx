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
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { UploadType } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  markInvoicePaidMutationDocument,
  submitPaymentProofMutationDocument,
} from "@/frontend/graphql/sharedDocuments/billing/billing-management.documents";
import { prepareUploadMutationDocument } from "@/frontend/graphql/sharedDocuments/resources/learning-resource.documents";
import { logger } from "@/frontend/utils/logger";
import type { MarkPaidInvoiceTarget } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { isAllowedPaymentProofMimeType, PAYMENT_PROOF_ACCEPT } from "@/shared/constants/billing/payment-proof";
import { getErrorMessage } from "@/shared/utils/error";
import { extToMime } from "@/shared/utils/storage.utils";

export type SubmitPaymentProofDialogMode = "submit" | "markPaid";

export type SubmitPaymentProofDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly invoice: MarkPaidInvoiceTarget | null;
  readonly mode: SubmitPaymentProofDialogMode;
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

export function SubmitPaymentProofDialog({
  open,
  onClose,
  invoice,
  mode,
  onSuccess,
  onError,
}: SubmitPaymentProofDialogProps): React.ReactNode {
  const t = useTranslations("dashboard.billing.submitProofDialog");
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
    const contentType = resolveProofContentType(file);
    if (!contentType) {
      setSelectedFile(null);
      setMutationError(t("invalidFileType"));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    setSelectedFile(file);
  };

  const handleConfirm = async () => {
    if (!invoiceId || !selectedFile) {
      return;
    }

    const contentType = resolveProofContentType(selectedFile);
    if (!contentType) {
      setMutationError(t("invalidFileType"));
      return;
    }

    setMutationError(null);
    setUploading(true);

    try {
      const fileNameOnly = selectedFile.name;
      const filePath = `payment-proofs/${invoiceId}/${fileNameOnly}`;
      const contentHash = await computeContentHash(selectedFile);

      const { data: prepData } = await prepareUploadMutation({
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
        setMutationError(t("uploadPrepareFailed"));
        onError?.(t("uploadPrepareFailed"));
        return;
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
      } else {
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
          setMutationError(t("uploadFailed"));
          onError?.(t("uploadFailed"));
          return;
        }
      }

      const mutation = mode === "submit" ? submitProof : markPaid;
      await mutation({
        variables: {
          invoiceId,
          proofFileId: fileId,
          expectedVersion: null,
        },
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error) || t("errorGeneric");
      setMutationError(message);
      onError?.(message);
    } finally {
      setUploading(false);
    }
  };

  const title = mode === "submit" ? t("titleSubmit") : t("titleMarkPaid");
  const canConfirm = Boolean(invoiceId && selectedFile && !busy);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
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

          <Stack spacing={1}>
            <Typography variant="labelMd">{t("selectFile")}</Typography>
            <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
              {t("fileHint")}
            </Typography>
            <Button variant="outlined" component="label" disabled={busy}>
              {selectedFile?.name ?? t("selectFile")}
              <input ref={fileInputRef} type="file" hidden accept={PAYMENT_PROOF_ACCEPT} onChange={handleFileChange} />
            </Button>
          </Stack>

          {busy ? (
            <Stack sx={{ alignItems: "center", py: 1 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          {t("cancel")}
        </Button>
        <Button variant="contained" onClick={() => void handleConfirm()} disabled={!canConfirm}>
          {busy ? t("confirming") : t("confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
