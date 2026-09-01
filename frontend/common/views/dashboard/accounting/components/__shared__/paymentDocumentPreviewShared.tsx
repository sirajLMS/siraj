"use client";

import { PaymentDocumentPreview } from "@/frontend/common/views/dashboard/accounting/components/PaymentDocumentPreview";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

type PaymentDetailLabels = PaymentsLabels["detail"];

/**
 * Invoice receipt preview section shared by the desktop and mobile payment
 * detail views; resolves both the inline preview and download URLs from the
 * payment's linked invoice.
 */
export function PaymentDocumentPreviewShared({
  labels,
  invoiceId,
}: Readonly<{ labels: PaymentDetailLabels; invoiceId: string | null | undefined }>) {
  const documentUrl = invoiceId ? `/api/invoices/${invoiceId}/download` : null;
  return (
    <PaymentDocumentPreview
      title={labels.documentPreview}
      emptyLabel={labels.documentEmpty}
      downloadLabel={labels.downloadPdf}
      zoomInLabel={labels.zoomIn}
      zoomOutLabel={labels.zoomOut}
      rotateLabel={labels.rotate}
      expandLabel={labels.expand}
      closeLabel={labels.close}
      src={documentUrl}
      downloadHref={documentUrl}
    />
  );
}
