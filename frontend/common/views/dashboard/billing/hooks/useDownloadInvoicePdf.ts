import { useCallback } from "react";

interface DownloadPdfArgs {
  readonly showFeedback: (message: string, severity: "success" | "error" | "info") => void;
  readonly popupBlockedLabel: string;
}

export function useDownloadInvoicePdf({ showFeedback, popupBlockedLabel }: DownloadPdfArgs) {
  return useCallback(
    (invoiceId: string) => {
      const popup = window.open(`/api/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
      if (!popup) {
        showFeedback(popupBlockedLabel, "error");
      }
    },
    [showFeedback, popupBlockedLabel]
  );
}
