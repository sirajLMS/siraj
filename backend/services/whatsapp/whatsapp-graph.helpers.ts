import { DomainError } from "@/backend/lib";
import {
  FETCH_TIMEOUT_MS,
  readErrorBody,
  resolveGraphApiVersion,
  WHATSAPP_CREDENTIAL_PLACEHOLDER,
} from "@/backend/lib/whatsapp-constants";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type {
  GraphApiRequestContext,
  SendTemplateMessageResponseBody,
  WhatsappAccountSelectType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Graph API plumbing shared by the whatsapp services that dispatch calls
 * with a DB-managed account credential: per-account context resolution and
 * the lifecycle-independent execute step (non-2xx responses surface as
 * `GraphApiError`; Meta error-code translation stays with each caller).
 */

/**
 * Per-account Graph API context, matching the per-account branch of the
 * account-sync credential resolution (DB-managed token over the env-global
 * bootstrap token). The unpersisted-token placeholder counts as "missing":
 * rows created without credentials must not dispatch a live Graph call.
 */
export async function accountGraphContext(
  account: WhatsappAccountSelectType,
  tErrors: ErrorsLabels
): Promise<GraphApiRequestContext> {
  if (!account.encryptedAccessToken || account.encryptedAccessToken === WHATSAPP_CREDENTIAL_PLACEHOLDER) {
    throw new DomainError("WHATSAPP_CONFIG", tErrors.whatsappAccessTokenNotConfigured);
  }
  return { accessToken: account.encryptedAccessToken, apiVersion: await resolveGraphApiVersion() };
}

/**
 * Lifecycle-independent Graph API execute step: the account/config services
 * keep their own fetch wrappers with different error contracts, so this one
 * only throws `GraphApiError` on non-2xx and returns the parsed JSON body.
 */
export async function executeGraphApiCall<TBody>(request: { url: string; init: RequestInit }): Promise<TBody> {
  const response = await fetch(request.url, {
    ...request.init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new GraphApiError(response.status, errorBody);
  }
  const body: TBody = await response.json();
  return body;
}

/** Execute a composer/verify send and return the raw send response body. */
export async function executeSendRequest(request: {
  url: string;
  init: RequestInit;
}): Promise<SendTemplateMessageResponseBody> {
  return executeGraphApiCall<SendTemplateMessageResponseBody>(request);
}
