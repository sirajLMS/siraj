import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";
import { resolveTrustedOrigin } from "@/backend/lib/trusted-origin";

const USER_ID = "user-1";
const INVOICE_ID = "invoice-1";
const DOWNLOAD_URL = `http://localhost:3000/api/invoices/${INVOICE_ID}/download`;

class ForbiddenError extends Error {}
class NotFoundError extends Error {}

type ServerUserContextMock = {
  userId: string | null;
  context: { role: string } | null;
};

const getServerUserContextMock = mock(
  async (): Promise<ServerUserContextMock> => ({
    userId: USER_ID,
    context: { role: "admin" },
  })
);

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
  resolveTrustedOrigin,
}));

await mock.module("@/backend/services", () => ({
  BillingManagementService: { verifyInvoiceAccess: verifyInvoiceAccessMock },
  StorageService: {
    getFilesForInvoice: getFilesForInvoiceMock,
    validatePath: validatePathMock,
  },
}));

async function importRoute() {
  return import("./route");
}

function makeDownloadRequest(): NextRequest {
  const headers = new Headers();
  headers.set("accept-language", "en");
  return new NextRequest(DOWNLOAD_URL, { method: "GET", headers });
}

beforeEach(() => {
  getServerUserContextMock.mockClear();
  verifyInvoiceAccessMock.mockClear();
  getFilesForInvoiceMock.mockClear();
  validatePathMock.mockClear();
  checkRateLimitMock.mockClear();

  checkRateLimitMock.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 600_000,
  });
  getServerUserContextMock.mockResolvedValue({
    userId: USER_ID,
    context: { role: "admin" },
  });
  verifyInvoiceAccessMock.mockResolvedValue();
  getFilesForInvoiceMock.mockResolvedValue([{ filePath: "invoices/2026/inv-001.pdf" }]);
  validatePathMock.mockReturnValue(true);
});

describe("GET /api/invoices/[id]/download", () => {
  test("returns 401 when unauthenticated", async () => {
    getServerUserContextMock.mockResolvedValueOnce({ userId: null, context: null });

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });

  test("returns 404 when invoice is not found", async () => {
    verifyInvoiceAccessMock.mockRejectedValueOnce(new NotFoundError("invoice not found"));

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Invoice not found" });
  });

  test("returns 403 when access is forbidden", async () => {
    verifyInvoiceAccessMock.mockRejectedValueOnce(new ForbiddenError("forbidden"));

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  test("returns 404 when no pdf file exists for the invoice", async () => {
    getFilesForInvoiceMock.mockResolvedValueOnce([]);

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "No PDF available for this invoice" });
  });

  test("returns 500 when storage path validation fails", async () => {
    validatePathMock.mockReturnValueOnce(false);

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "An unexpected error occurred. Please try again later." });
  });

  test("returns 429 when the export rate limit is exceeded", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 600_000,
    });

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests. Please try again later." });
    expect(verifyInvoiceAccessMock).toHaveBeenCalledTimes(0);
  });

  test("returns 302/307 redirect with safely encoded relative file path", async () => {
    getFilesForInvoiceMock.mockResolvedValueOnce([{ filePath: "invoices/2026/invoice #1 & draft.pdf" }]);

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
    expect([302, 307]).toContain(response.status);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/api/storage/files/invoices/2026/invoice%20%231%20%26%20draft.pdf");
  });

  test("redirect target ignores a spoofed X-Forwarded-Host and falls back to the trusted origin", async () => {
    const headers = new Headers();
    headers.set("accept-language", "en");
    headers.set("x-forwarded-host", "evil-attacker.com");
    const request = new NextRequest(DOWNLOAD_URL, { method: "GET", headers });

    const { GET } = await importRoute();
    const response = await GET(request, {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect([302, 307]).toContain(response.status);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/api/storage/files/invoices/2026/inv-001.pdf");
    expect(location).not.toContain("evil-attacker.com");
  });
});
