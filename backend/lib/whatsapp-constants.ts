/**
 * Shared constants and helpers used across WhatsApp Graph API integration layers.
 *
 * Extracted to avoid duplication between the MetaCloudApiAdapter and the
 * account service's `executeGraphApiFetch` helper.
 */

import { resolveEnvConfig } from "@/backend/lib/env-config-resolver";
import type { ErrorsLabels } from "@/shared/locale";

/** Maximum concurrent Graph API calls per batch / fan-out (P1). */
export const MAX_CONCURRENT_CALLS = 10;

/** Abort timeout (ms) for all Graph API fetch calls. */
export const FETCH_TIMEOUT_MS = 10_000;

/**
 * Reads the error body from a non-2xx `Response`. Tries `response.json()`
 * first (structured Meta error envelope), falling back to `response.text()`
 * when the body is not valid JSON.
 *
 * Shared by `executeGraphApiFetch` (whatsapp-account.service) and
 * `handleHttpError` (MetaCloudApiAdapter) to avoid verbatim duplication.
 */
export async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}

/**
 * Resolves the Graph API access-token and api-version from env-config, throwing
 * a localized error when the access token is missing.
 *
 * Both `whatsapp-account.service.ts` (`resolveGraphApiContext`) and
 * `MetaCloudApiAdapter.ts` (`resolveCredentials` env-config fallback) assemble
 * the same `{ accessToken, apiVersion }` context shape with the same
 * missing-token → throw pattern. This helper centralizes that logic.
 *
 * Callers that need additional env-config values (e.g. `wabaId`,
 * `phoneNumberId`) resolve those separately and combine with the returned
 * context.
 *
 * @param tErrors Localized error labels for the caller's locale.
 * @returns `{ accessToken, apiVersion }` — the shared context fields.
 * @throws When `WHATSAPP_ACCESS_TOKEN` is not configured.
 */
export async function resolveGraphApiContextFromEnv(
  tErrors: ErrorsLabels
): Promise<{ accessToken: string; apiVersion: string | undefined }> {
  const accessToken = await resolveEnvConfig("WHATSAPP_ACCESS_TOKEN");
  if (!accessToken) {
    throw new Error(tErrors.whatsappAccessTokenNotConfigured);
  }
  const apiVersion = await resolveEnvConfig("WHATSAPP_API_VERSION");
  return { accessToken, apiVersion };
}
