import { type NextRequest, NextResponse } from "next/server";
import { StorageDbRepository } from "@/backend/db/repo";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { ForbiddenError, NotFoundError } from "@/backend/lib/errors";
import logger from "@/backend/lib/logger";
import { BillingManagementService } from "@/backend/services/billing/billing-management.service";
import { StorageUtils } from "@/backend/utils/storage.utils";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await params;

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await BillingManagementService.verifyInvoiceAccess(userId, invoiceId, context);

    const files = await StorageDbRepository.getFilesForInvoice(invoiceId, "invoice_pdf", undefined, 50);
    const pdfFile = files[0];

    if (!pdfFile?.filePath) {
      return NextResponse.json({ error: "No PDF available for this invoice" }, { status: 404 });
    }

    if (!StorageUtils.validatePath(pdfFile.filePath)) {
      logger.error("Invoice PDF filePath failed validation", { invoiceId, filePath: pdfFile.filePath });
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
