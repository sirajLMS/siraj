/**
 * Shared types and helpers for Meta Cloud API (Graph API v23.0) request builders.
 *
 * Each `*.request.ts` file under `./requests/` exports `buildRequest(ctx)` →
 * `{ url, init }` and `parseResponse(body)` for one Graph API endpoint.
 * The adapter (Task 5) supplies `accessToken`, `apiVersion`, and other
 * runtime context via `GraphApiRequestContext`.
 *
 * v1 core builder set (Q1 — no register/deregister/code/template CRUD builders):
 *  - send-template-message.request.ts  (POST /{phone_number_id}/messages)
 *  - list-phone-numbers.request.ts      (GET  /{waba_id}/phone_numbers)
 *  - get-phone-number.request.ts        (GET  /{phone_number_id})
 *  - list-message-templates.request.ts  (GET  /{waba_id}/message_templates)
 */

/**
 * Canonical type definitions have been moved to the types layer:
 * `@/backend/types/whatsapp/whatsapp-cloud-api.types.ts`
 *
 * They are re-exported here so existing import sites (request builders, adapter)
 * continue to work without changes.
 */
export type {
  GraphApiPaginatedResponse,
  GraphApiRequestContext,
  GraphApiRequestInit,
} from "@/backend/types/whatsapp/whatsapp-cloud-api.types";

/** Base URL for Meta Graph API. */
const GRAPH_API_BASE_URL = "https://graph.facebook.com";

/**
 * Default API version. The live value is resolved from the
 * `WHATSAPP_API_VERSION` env-config key (or DB override) by the adapter.
 */
/**
 * Default WhatsApp Graph API version used when WHATSAPP_API_VERSION env var
 * is not set. Update this when Meta releases a new stable API version.
 */
const DEFAULT_API_VERSION = "23.0";

/**
 * Builds a fully-qualified Graph API URL from a path segment and optional
 * query string.
 *
 * @example
 * buildGraphUrl("/123456789/messages", "v23.0") // → "https://graph.facebook.com/v23.0/123456789/messages"
 * buildGraphUrl("/123456789/phone_numbers", "v23.0", "?limit=100&after=abc") // → full URL with query
 */
export function buildGraphUrl(path: string, apiVersion?: string, queryString?: string): string {
  const rawVersion = apiVersion?.trim() || DEFAULT_API_VERSION;
  // Strip leading 'v' or 'V' to avoid double-prefix (e.g. "v23.0" → "23.0")
  const version = rawVersion.replace(/^[vV]/, "");
  // Validate version: digits with optional dot-digits (e.g. "23.0") — no injection (r6-sec-06)
  if (!/^\d+(\.\d+)?$/.test(version)) {
    throw new Error(`Invalid apiVersion: "${rawVersion}" does not match expected numeric format`);
  }
  // Encode path segments to prevent path traversal / SSRF
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const encodedPath = normalizedPath
    .split("/")
    .map(segment => (segment ? encodeURIComponent(segment) : segment))
    .join("/");
  const base = `${GRAPH_API_BASE_URL}/v${version}${encodedPath}`;
  if (queryString && queryString.length > 0) {
    return queryString.startsWith("?") ? `${base}${queryString}` : `${base}?${queryString}`;
  }
  return base;
}

/**
 * Builds standard HTTP headers for a Graph API request.
 *
 * Sets `Authorization: Bearer <accessToken>` for OAuth2 authentication with the
 * Meta Graph API, and optionally appends `Content-Type: application/json` for
 * POST requests that include a JSON body. The token is never logged — it is
 * placed directly into the headers object for the outgoing fetch call.
 */
export function buildAuthHeaders(accessToken: string, includeJsonContentType = false): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

/**
 * Error wrapper for non-2xx Graph API responses.
 * Carries Meta's error body for upstream inspection.
 */
export class GraphApiError extends Error {
  readonly statusCode: number;
  readonly errorBody: unknown;
  readonly code?: string;
  readonly type?: string;
  readonly fbtrace_id?: string;
  readonly error_subcode?: number;

  constructor(statusCode: number, errorBody: unknown) {
    super(`Graph API error ${statusCode}`);
    this.name = "GraphApiError";
    this.statusCode = statusCode;
    this.errorBody = errorBody;

    // Extract stable Meta error fields from the error body so callers can
    // inspect them without re-parsing `errorBody` themselves.
    const extracted = extractMetaErrorFields(errorBody);
    if (extracted) {
      this.code = extracted.code;
      this.type = extracted.type;
      this.fbtrace_id = extracted.fbtrace_id;
      this.error_subcode = extracted.error_subcode;
    }
  }
}

/**
 * Shape of the fields extracted from Meta's error body by
 * {@link extractMetaErrorFields}.
 */
interface MetaErrorFields {
  code?: string;
  type?: string;
  fbtrace_id?: string;
  error_subcode?: number;
}

/**
 * Extracts stable Meta error fields (`code`, `type`, `fbtrace_id`,
 * `error_subcode`) from a non-2xx response body.
 *
 * Returns `undefined` when the body shape does not match (e.g. `null`,
 * primitives, or missing `error` envelope). Used by {@link GraphApiError}
 * to populate its readonly fields without deeply nesting the constructor.
 */
function extractMetaErrorFields(errorBody: unknown): MetaErrorFields | undefined {
  if (!errorBody || typeof errorBody !== "object") {
    return undefined;
  }

  const body = errorBody as {
    error?: {
      code?: unknown;
      type?: unknown;
      fbtrace_id?: unknown;
      error_subcode?: unknown;
    };
  };

  const err = body.error;
  if (!err) {
    return undefined;
  }

  return {
    code: typeof err.code === "number" ? String(err.code) : undefined,
    type: typeof err.type === "string" ? err.type : undefined,
    fbtrace_id: typeof err.fbtrace_id === "string" ? err.fbtrace_id : undefined,
    error_subcode: typeof err.error_subcode === "number" ? err.error_subcode : undefined,
  };
}

/**
 * Extracts the Meta error `code` from a non-2xx response body.
 *
 * Meta's error envelope is `{ error: { code: number, message: string, ... } }`.
 * Returns `undefined` when the body shape does not match.
 *
 * Shared by `MetaCloudApiAdapter.handleHttpError` and any consumer of
 * `GraphApiError` that needs to inspect the Meta error code (e.g. for
 * rate-limit detection via code 131056).
 */
export function extractMetaErrorCode(errorBody: unknown): number | undefined {
  if (errorBody && typeof errorBody === "object") {
    const body = errorBody as { error?: { code?: unknown } };
    const code = body.error?.code;
    if (typeof code === "number") {
      return code;
    }
  }
  return undefined;
}

/**
 * Extracts the Meta error `message` from a non-2xx response body.
 *
 * Returns `undefined` when the body shape does not match or the message
 * is not a string. Callers can use this to provide a failure reason when
 * marking a delivery as FAILED.
 */
export function extractMetaErrorMessage(errorBody: unknown): string | undefined {
  if (errorBody && typeof errorBody === "object") {
    const body = errorBody as { error?: { message?: unknown } };
    const message = body.error?.message;
    if (typeof message === "string") {
      return message;
    }
  }
  return undefined;
}
