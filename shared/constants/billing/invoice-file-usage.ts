export const INVOICE_FILE_USAGE = {
  INVOICE_PDF: "invoice_pdf",
  PAYMENT_PROOF: "payment_proof",
} as const;

export type InvoiceFileUsage = (typeof INVOICE_FILE_USAGE)[keyof typeof INVOICE_FILE_USAGE];
