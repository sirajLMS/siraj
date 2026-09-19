/**
 * Guards for outbound provider HTTP calls (FX rate providers, WhatsApp Graph
 * API). Outbound requests carry secret-bearing headers (Bearer tokens, API
 * keys), so they are made with `redirect: "error"` to guarantee a redirect
 * target can never receive them. Responses are bounded to a byte budget so a
 * hostile or misbehaving provider cannot exhaust memory during body parsing.
 */

/** Default maximum accepted provider response size: 1 MB. */
const MAX_PROVIDER_RESPONSE_BYTES = 1_000_000;

/**
 * Build fetch init options that forbid redirects outright.
 *
 * Merge the result into the caller's `RequestInit` (the caller keeps control
 * of method, headers, body, and signal). With `redirect: "error"`, `fetch`
 * rejects on any 3xx response instead of transparently replaying the request —
 * including its `Authorization` / `apikey` headers — to the redirect target.
 */
export function noFollowRedirectInit(): Pick<RequestInit, "redirect"> {
  return { redirect: "error" };
}

function assertContentLengthWithinBudget(response: Response, maxBytes: number): void {
  const header = response.headers.get("content-length");
  if (header === null) {
    return;
  }
  const contentLength = Number(header);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`Provider response rejected: content-length ${contentLength} exceeds byte budget ${maxBytes}`);
  }
}

/**
 * Read a provider response body as text under a byte budget.
 *
 * Rejects before download when `content-length` is present and over budget,
 * then verifies the actual byte length after `arrayBuffer()` (chunked /
 * header-less responses are caught by the second check). Throws a plain
 * `Error` on violation — callers treat it as any other provider failure.
 */
export async function readResponseBodyWithByteBudget(
  response: Response,
  maxBytes: number = MAX_PROVIDER_RESPONSE_BYTES
): Promise<string> {
  assertContentLengthWithinBudget(response, maxBytes);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Provider response rejected: body of ${buffer.byteLength} bytes exceeds byte budget ${maxBytes}`);
  }
  return new TextDecoder().decode(buffer);
}

/**
 * Read and JSON.parse a provider response body under a byte budget.
 *
 * Declared `unknown` so downstream code narrows via schema parsing instead of
 * trusting the provider's shape.
 */
export async function readJsonWithByteBudget(
  response: Response,
  maxBytes: number = MAX_PROVIDER_RESPONSE_BYTES
): Promise<unknown> {
  const text = await readResponseBodyWithByteBudget(response, maxBytes);
  return JSON.parse(text) as unknown;
}
