import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/storage/files/[[...path]]/route";

describe("GET /api/storage/files/[[...path]] Security & Traversal Safeguards", () => {
  test("returns 400 when path parameter is missing/empty", async () => {
    const req = new NextRequest("http://localhost/api/storage/files");
    const res = await GET(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 400 for direct path traversal attempts starting with public/", async () => {
    const req = new NextRequest("http://localhost/api/storage/files/public/../secret.txt");
    const res = await GET(req, { params: Promise.resolve({ path: ["public", "..", "secret.txt"] }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 400 for nested path traversal attempts in public subdirectories", async () => {
    const req = new NextRequest("http://localhost/api/storage/files/public/avatars/../../etc/passwd");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["public", "avatars", "..", "..", "etc", "passwd"] }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 400 for double slashes in path", async () => {
    const req = new NextRequest("http://localhost/api/storage/files/public//etc/passwd");
    const res = await GET(req, { params: Promise.resolve({ path: ["public", "", "etc", "passwd"] }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 400 for invalid/disallowed characters in path", async () => {
    const req = new NextRequest("http://localhost/api/storage/files/public/<script>");
    const res = await GET(req, { params: Promise.resolve({ path: ["public", "<script>"] }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 404 for non-existent public files", async () => {
    const req = new NextRequest("http://localhost/api/storage/files/public/non-existent-file-123456.png");
    const res = await GET(req, { params: Promise.resolve({ path: ["public", "non-existent-file-123456.png"] }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("returns 401 when accessing non-public files without authentication", async () => {
    const req = new NextRequest("http://localhost/api/storage/files/invoices/inv-001.pdf");
    const res = await GET(req, { params: Promise.resolve({ path: ["invoices", "inv-001.pdf"] }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
