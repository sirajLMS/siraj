import { WhatsappTokenTestFailureKind } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { logger } from "@/backend/lib/logger";
import {
  extractMetaErrorCode,
  extractMetaErrorMessage,
  GraphApiError,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import { buildGetPhoneNumberRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import { phoneNumberResultSchema } from "@/backend/services/whatsapp/whatsapp-account.schemas";
import { executeGraphApiFetch } from "@/backend/services/whatsapp/whatsapp-account.shared.helpers";
import type { GetPhoneNumberResult } from "@/backend/types";

/**
 * Verifies a token against Meta's Graph API for the given phone number and
 * reports whether Meta considers the number CONNECTED. Returns
 * `isValid = false` (and `isConnected = false`) instead of throwing on any
 * network or API error so callers can safely persist credentials regardless.
 */
export async function checkPhoneNumberStatusWithToken(
  phoneNumberId: string,
  accessToken: string,
  apiVersion: string
): Promise<{ isValid: boolean; status?: string; isConnected: boolean }> {
  try {
    const request = buildGetPhoneNumberRequest({ accessToken, apiVersion }, { phoneNumberId });
    const detail = await executeGraphApiFetch<GetPhoneNumberResult>(request, phoneNumberResultSchema);
    const isConnected = detail.status?.toUpperCase() === "CONNECTED";
    return {
      isValid: true,
      status: detail.status,
      isConnected,
    };
  } catch (error) {
    logger.warn(
      `whatsapp-account-service: checkPhoneNumberStatusWithToken failed for phoneNumberId=${phoneNumberId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { phoneNumberId, error }
    );
    return { isValid: false, isConnected: false };
  }
}

/**
 * Extracts a human-readable failure reason AND a machine-readable failure
 * kind from a thrown error, so the UI can pick a translated, actionable hint
 * instead of rendering Meta's raw message alone (Meta's "You do not have
 * sufficient permissions..." is indistinguishable from a Siraj auth error).
 *
 * Classification (Meta Graph API error envelope):
 *  - code 190 or "Invalid OAuth access token" → INVALID_TOKEN
 *  - code 10 / 200 → META_PERMISSIONS (system user lacks WABA asset access
 *    or the token is missing whatsapp_business_management / -messaging)
 *  - other GraphApiError → META_ERROR
 *  - non-GraphApiError (fetch/network/parse) → NETWORK_ERROR
 *
 * Prefers Meta's own error message as the reason when available, falling
 * back to the Error's message. `reason` is null when nothing meaningful
 * exists.
 */
function classifyTokenTestFailure(error: unknown): {
  reason: string | null;
  failureKind: WhatsappTokenTestFailureKind;
} {
  let fallbackReason: string | null = null;
  if (error instanceof Error) {
    fallbackReason = error.message;
  } else if (typeof error === "string") {
    fallbackReason = error;
  }
  if (!(error instanceof GraphApiError)) {
    return { reason: fallbackReason, failureKind: WhatsappTokenTestFailureKind.NETWORK_ERROR };
  }
  const metaMessage = extractMetaErrorMessage(error.errorBody) ?? fallbackReason;
  const code = extractMetaErrorCode(error.errorBody);
  if (code === 190 || metaMessage?.includes("Invalid OAuth access token")) {
    return { reason: metaMessage, failureKind: WhatsappTokenTestFailureKind.INVALID_TOKEN };
  }
  if (code === 10 || code === 200) {
    return { reason: metaMessage, failureKind: WhatsappTokenTestFailureKind.META_PERMISSIONS };
  }
  return { reason: metaMessage, failureKind: WhatsappTokenTestFailureKind.META_ERROR };
}

/**
 * Same contract as `checkPhoneNumberStatusWithToken`, but additionally
 * returns a human-readable `reason` explaining why the check failed. Used
 * by the user-facing `testAccessToken` to show WHY a token test failed.
 */
export async function checkPhoneNumberWithReason(
  phoneNumberId: string,
  accessToken: string,
  apiVersion: string
): Promise<{
  isValid: boolean;
  status: string | null;
  isConnected: boolean;
  reason: string | null;
  failureKind: WhatsappTokenTestFailureKind | null;
}> {
  try {
    const request = buildGetPhoneNumberRequest({ accessToken, apiVersion }, { phoneNumberId });
    const detail = await executeGraphApiFetch<GetPhoneNumberResult>(request, phoneNumberResultSchema);
    const isConnected = detail.status?.toUpperCase() === "CONNECTED";
    return {
      isValid: true,
      status: detail.status ?? null,
      isConnected,
      reason: isConnected ? null : (detail.status ?? null),
      failureKind: isConnected ? null : WhatsappTokenTestFailureKind.NOT_CONNECTED,
    };
  } catch (error) {
    const { reason, failureKind } = classifyTokenTestFailure(error);
    logger.warn(
      `whatsapp-account-service: checkPhoneNumberWithReason failed for phoneNumberId=${phoneNumberId}: ${
        reason ?? (error instanceof Error ? error.message : String(error))
      }`,
      { phoneNumberId, reason, failureKind }
    );
    return { isValid: false, status: null, isConnected: false, reason, failureKind };
  }
}
