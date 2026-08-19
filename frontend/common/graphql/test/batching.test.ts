import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { loginDemoUser } from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { clearCookies, getTestCookie } from "@/frontend/common/graphql/test/testClient";
import { getTestGraphqlUrl } from "@/frontend/common/graphql/test/testPort";
import { testLogger } from "@/shared/lib/logger/testlogger";

/**
 * Integration tests for HTTP request batching (Phase E2).
 *
 * Apollo Server 4 disables batched HTTP requests by default. Phase E2 enables
 * `allowBatchedHttpRequests: true` on the server constructor and switches the
 * client from `HttpLink` to `BatchHttpLink`. These tests verify:
 *
 * 1. The server accepts a JSON array body (batched request) and returns a JSON
 *    array of individual operation responses.
 * 2. Persisted queries (APQ) work correctly with batched requests.
 * 3. Unauthenticated batched requests return errors.
 * 4. The client-side Apollo provider uses `BatchHttpLink` (verified by
 *    inspecting the source file).
 */

// ── Type guards (replace unsafe type assertions) ────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasKey(obj: Record<string, unknown>, key: string): boolean {
  return key in obj;
}

function getRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Expected object, got ${typeof value}`);
  return value;
}

function getRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error(`Expected array, got ${typeof value}`);
  return value.map(getRecord);
}

// ── Request helpers (module scope — no closure captures) ─────────────────

async function sendBatchedRequest(body: unknown[], cookieHeader?: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apollo-require-preflight": "true",
  };
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  return fetchFn(getTestGraphqlUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function buildAuthCookieHeader(): string {
  const sessionId = getTestCookie("session_id");
  const accessToken = getTestCookie("access_token");
  const parts: string[] = [];
  if (sessionId) parts.push(`session_id=${sessionId}`);
  if (accessToken) parts.push(`access_token=${accessToken}`);
  return parts.join("; ");
}

async function sha256Hex(text: string): Promise<string> {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle?.digest) {
    throw new Error("crypto.subtle not available");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Integration tests (server-side batching) ─────────────────────────────

describe("GraphQL HTTP Batching Integration Tests", () => {
  setupTestServerLifecycle();

  test("server accepts a batched array body and returns array of responses", async () => {
    await loginDemoUser("super_admin");
    const cookieHeader = buildAuthCookieHeader();

    const batch = [{ query: "{ me { id } }" }, { query: "{ me { id name } }" }];

    const response = await sendBatchedRequest(batch, cookieHeader);
    expect(response.status).toBe(200);

    const json = await response.json();
    const entries = getRecordArray(json);
    expect(entries).toHaveLength(2);

    for (const entry of entries) {
      expect(hasKey(entry, "data") || hasKey(entry, "errors")).toBe(true);
    }
  });

  test("batched request without auth cookies returns errors for all entries", async () => {
    const batch = [{ query: "{ me { id } }" }, { query: "{ me { id name } }" }];

    const response = await sendBatchedRequest(batch);
    expect(response.status).toBe(200);

    const json = await response.json();
    const entries = getRecordArray(json);
    expect(entries).toHaveLength(2);

    for (const entry of entries) {
      expect(hasKey(entry, "errors")).toBe(true);
    }
  });

  test("single-element batched request still works after enabling batching", async () => {
    await loginDemoUser("super_admin");
    const cookieHeader = buildAuthCookieHeader();

    const response = await sendBatchedRequest([{ query: "{ me { id } }" }], cookieHeader);
    expect(response.status).toBe(200);

    const json = await response.json();
    const entries = getRecordArray(json);
    expect(entries).toHaveLength(1);
    expect(hasKey(entries[0], "data") || hasKey(entries[0], "errors")).toBe(true);
  });

  test("APQ works with batched requests — persisted query hash is resolved", async () => {
    await loginDemoUser("super_admin");
    const cookieHeader = buildAuthCookieHeader();

    const queryText = "{ me { id } }";
    let hashHex: string;
    try {
      hashHex = await sha256Hex(queryText);
    } catch {
      testLogger.warn("crypto.subtle not available — skipping APQ batch test");
      return;
    }

    const persistedQuery = { sha256Hash: hashHex, version: 1 };

    // Step 1: Send batch with only hash → expect PersistedQueryNotFound
    const batch1 = [{ extensions: { persistedQuery } }];
    const res1 = await sendBatchedRequest(batch1, cookieHeader);
    const json1 = await res1.json();
    const entry1 = getRecord(getRecordArray(json1)[0]);
    expect(hasKey(entry1, "errors")).toBe(true);
    const errors1 = entry1.errors;
    if (!Array.isArray(errors1)) throw new Error("Expected errors array");
    const notFound = errors1.some(e => {
      if (!isRecord(e)) return false;
      const ext = e.extensions;
      return isRecord(ext) && ext.code === "PERSISTED_QUERY_NOT_FOUND";
    });
    expect(notFound).toBe(true);

    // Step 2: Send batch with hash AND query → registers and executes
    const batch2 = [{ query: queryText, extensions: { persistedQuery } }];
    const res2 = await sendBatchedRequest(batch2, cookieHeader);
    const json2 = await res2.json();
    const entry2 = getRecord(getRecordArray(json2)[0]);
    expect(hasKey(entry2, "data")).toBe(true);

    // Step 3: Send batch with only hash → succeeds (already registered)
    const batch3 = [{ extensions: { persistedQuery } }];
    const res3 = await sendBatchedRequest(batch3, cookieHeader);
    const json3 = await res3.json();
    const entry3 = getRecord(getRecordArray(json3)[0]);
    expect(hasKey(entry3, "data")).toBe(true);
  });

  test("authenticated batched request returns valid user data for multiple queries", async () => {
    await loginDemoUser("super_admin");
    const cookieHeader = buildAuthCookieHeader();

    const batch = [{ query: "{ me { id } }" }, { query: "{ me { id name } }" }, { query: "{ me { id name role } }" }];

    const response = await sendBatchedRequest(batch, cookieHeader);
    expect(response.status).toBe(200);

    const json = await response.json();
    const entries = getRecordArray(json);
    expect(entries).toHaveLength(3);

    for (const entry of entries) {
      expect(hasKey(entry, "data")).toBe(true);
      const data = entry.data;
      if (!isRecord(data)) throw new Error("No data in batch entry");
      const me = data.me;
      expect(me).not.toBeNull();
      if (!isRecord(me)) throw new Error("Expected me to be an object");
      expect(me.id).toBeDefined();
    }
  });

  test("clearing cookies after batch test does not pollute subsequent tests", () => {
    clearCookies();
    expect(getTestCookie("session_id")).toBeUndefined();
    expect(getTestCookie("access_token")).toBeUndefined();
  });
});

// ── Client-side structural tests ──────────────────────────────────────────

describe("Client-side BatchHttpLink configuration", () => {
  test("BatchHttpLink is importable from @apollo/client/link/batch-http", async () => {
    const mod = await import("@apollo/client/link/batch-http");
    expect(mod.BatchHttpLink).toBeDefined();
    expect(typeof mod.BatchHttpLink).toBe("function");
  });

  test("AppApolloProvider uses BatchHttpLink (not HttpLink) with PersistedQueryLink before it", async () => {
    const source = await readFile("frontend/common/providers/apollo/AppApolloProvider.tsx", "utf8");

    expect(source).toContain("BatchHttpLink");
    expect(source).not.toMatch(/import\s+\{[^}]*HttpLink[^}]*\}\s+from\s+"@apollo\/client"/);
    expect(source).toContain("PersistedQueryLink");

    const pqIdx = source.indexOf("PersistedQueryLink");
    const batchIdx = source.indexOf("new BatchHttpLink");
    expect(pqIdx).toBeGreaterThan(-1);
    expect(batchIdx).toBeGreaterThan(-1);
    expect(pqIdx).toBeLessThan(batchIdx);
  });

  test("ApolloServer constructor has allowBatchedHttpRequests: true", async () => {
    const source = await readFile("app/api/graphql/route.ts", "utf8");
    expect(source).toContain("allowBatchedHttpRequests: true");
  });
});
