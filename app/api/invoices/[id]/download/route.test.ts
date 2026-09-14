import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const INVOICE_ID = "22222222-2222-2222-2222-222222222222";
const DOWNLOAD_URL = `http://localhost:3000/api/invoices/${INVOICE_ID}/download`;

class ForbiddenError extends Error {}
class NotFoundError extends Error {}

const getServerUserContextMock = mock(async () => ({
  userId: USER_ID as string | null,
  context: { role: "admin" },
}));

const verifyInvoiceAccessMock = mock(async () => {});

const getFilesForInvoiceMock = mock(async () => [{ filePath: "invoices/2026/inv-001.pdf" }]);

const validatePathMock = mock((_path: string) => true);

await mock.module("@/backend/lib", () => ({
  ForbiddenError,
  NotFoundError,
  getServerUserContext: getServerUserContextMock,
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
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

  test("returns 302/307 redirect with safely encoded relative file path", async () => {
    getFilesForInvoiceMock.mockResolvedValueOnce([{ filePath: "invoices/2026/invoice #1 & draft.pdf" }]);

    const { GET } = await importRoute();
    const response = await GET(makeDownloadRequest(), {
      params: Promise.resolve({ id: INVOICE_ID }),
    });

    expect([302, 307]).toContain(response.status);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/api/storage/files/invoices/2026/invoice%20%231%20%26%20draft.pdf");
  });
});
