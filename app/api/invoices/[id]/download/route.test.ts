import { beforeEach, describe, expect, mock, test } from "bun:test";

const { NextRequest } = await import("next/server");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "11111111-1111-1111-1111-111111111111";
const INVOICE_ID = "22222222-2222-2222-2222-222222222222";
const DOWNLOAD_URL = `http://localhost:3000/api/invoices/${INVOICE_ID}/download`;

class ForbiddenError extends Error {}
class NotFoundError extends Error {}

const getServerUserContextMock = mock(async () => ({ userId: USER_ID, context: {} }));
const verifyInvoiceAccessMock = mock(async () => {});
const getFilesForInvoiceMock = mock(async () => [{ filePath: "invoices/2026/inv-001.pdf" }]);
const validatePathMock = mock((_path: string) => true);

const checkRateLimitMock = mock(async () => ({
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 600_000,
}));

await mock.module("@/backend/lib/ratelimit", () => ({
  checkRateLimit: checkRateLimitMock,
  exportRateLimiter: {},
}));

await mock.module("@/backend/lib", () => ({
  ForbiddenError,
  NotFoundError,
  getServerUserContext: getServerUserContextMock,
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("@/backend/services", () => ({
  BillingManagementService: {
    verifyInvoiceAccess: verifyInvoiceAccessMock,
  },
  StorageService: {
    getFilesForInvoice: getFilesForInvoiceMock,
    validatePath: validatePathMock,
  },
}));

const { GET } = await import("./route");

function makeDownloadRequest() {
  const headers = new Headers();
  headers.set("accept-language", "en");
  return new NextRequest(DOWNLOAD_URL, { method: "GET", headers });
}

async function callDownload() {
  return GET(makeDownloadRequest(), { params: Promise.resolve({ id: INVOICE_ID }) });
}

beforeEach(() => {
  getServerUserContextMock.mockClear();
  verifyInvoiceAccessMock.mockClear();
  getFilesForInvoiceMock.mockClear();
  validatePathMock.mockClear();
  checkRateLimitMock.mockClear();

  getServerUserContextMock.mockResolvedValue({ userId: USER_ID, context: {} as never });
  verifyInvoiceAccessMock.mockResolvedValue();
  getFilesForInvoiceMock.mockResolvedValue([{ filePath: "invoices/2026/inv-001.pdf" }]);
  validatePathMock.mockReturnValue(true);
  checkRateLimitMock.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 600_000,
  });
});

describe("GET /api/invoices/[id]/download", () => {
  test("returns 401 when no authenticated user", async () => {
    getServerUserContextMock.mockResolvedValueOnce({ userId: null, context: {} as never });

    const response = await callDownload();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
    expect(checkRateLimitMock).toHaveBeenCalledTimes(0);
    expect(verifyInvoiceAccessMock).toHaveBeenCalledTimes(0);
  });

  test("returns 429 when rate limit is exceeded", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 600_000,
    });

    const response = await callDownload();

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests. Please try again later." });
    expect(verifyInvoiceAccessMock).toHaveBeenCalledTimes(0);
  });

  test("returns 403 when user lacks access to invoice", async () => {
    verifyInvoiceAccessMock.mockRejectedValueOnce(new ForbiddenError("Access denied"));

    const response = await callDownload();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  test("returns 404 when invoice is not found", async () => {
    verifyInvoiceAccessMock.mockRejectedValueOnce(new NotFoundError("Invoice missing"));

    const response = await callDownload();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Invoice not found" });
  });

  test("returns 404 when no PDF file exists for invoice", async () => {
    getFilesForInvoiceMock.mockResolvedValueOnce([]);

    const response = await callDownload();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "No PDF available for this invoice" });
  });

  test("returns 500 when filePath fails path validation", async () => {
    validatePathMock.mockReturnValueOnce(false);

    const response = await callDownload();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An unexpected error occurred. Please try again later." });
  });

  test("returns 500 when filePath starts with public/ prefix", async () => {
    getFilesForInvoiceMock.mockResolvedValueOnce([{ filePath: "public/invoices/inv-001.pdf" }]);

    const response = await callDownload();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An unexpected error occurred. Please try again later." });
  });

  test("returns redirect on successful download", async () => {
    const response = await callDownload();

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/api/storage/files/invoices/2026/inv-001.pdf");
    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
    expect(verifyInvoiceAccessMock).toHaveBeenCalledTimes(1);
  });
});
