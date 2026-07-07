import { type NextRequest, NextResponse } from "next/server";
import { ForbiddenError, getServerUserContext, logger, NotFoundError } from "@/backend/lib";
import { BillingManagementService, StorageService } from "@/backend/services";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await params;

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await BillingManagementService.verifyInvoiceAccess(userId, invoiceId, context);

    const files = await StorageService.getFilesForInvoice(invoiceId, "invoice_pdf", 50);
    const pdfFile = files[0];

    if (!pdfFile?.filePath) {
      return NextResponse.json({ error: "No PDF available for this invoice" }, { status: 404 });
    }

    if (!StorageService.validatePath(pdfFile.filePath)) {
      logger.error("Invoice PDF filePath failed validation", { invoiceId });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.redirect(new URL(`/api/storage/files/${pdfFile.filePath}`, _request.url));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    logger.error("Failed to retrieve invoice PDF", { invoiceId, error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
