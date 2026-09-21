import { type NextRequest, NextResponse } from "next/server";
import { ForbiddenError, getServerUserContext, logger, NotFoundError } from "@/backend/lib";
import { checkRateLimit, exportRateLimiter } from "@/backend/lib/ratelimit";
import { BillingManagementService, StorageService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await params;

  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: tErrors.file.authenticationRequired }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`export:${userId}`, exportRateLimiter);
  if (!rateLimit.success) {
    return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
  }

  try {
    await BillingManagementService.verifyInvoiceAccess(userId, invoiceId, context, tErrors);

    const files = await StorageService.getFilesForInvoice(invoiceId, "invoice_pdf", 50);
    const pdfFile = files[0];

    if (!pdfFile?.filePath) {
      return NextResponse.json({ error: tErrors.noPdfAvailable }, { status: 404 });
    }

    if (!StorageService.validatePath(pdfFile.filePath)) {
      logger.error("Invoice PDF filePath failed validation", { invoiceId });
      return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
    }

    // Security: files under public/ are served unauthenticated by the storage route,
    // so invoice PDFs must never live there (they would bypass verifyInvoiceAccess).
    if (pdfFile.filePath.startsWith("public/")) {
      logger.error("Invoice PDF stored under public/ prefix — refusing unauthenticated storage redirect", {
        invoiceId,
      });
      return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
    }

    const safeEncodedPath = pdfFile.filePath
      .split("/")
      .map(segment => encodeURIComponent(segment))
      .join("/");

    return NextResponse.redirect(new URL(`/api/storage/files/${safeEncodedPath}`, request.url));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: tErrors.invoiceNotFoundShort }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: tErrors.forbidden }, { status: 403 });
    }

    logger.error("Failed to retrieve invoice PDF", { invoiceId, error });
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
