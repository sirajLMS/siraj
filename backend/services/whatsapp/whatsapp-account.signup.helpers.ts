import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappOnboardingMode } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { ConflictError, WhatsappEmbeddedSignupError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { resolveGraphApiVersion } from "@/backend/lib/whatsapp-constants";
import {
  buildExchangeEmbeddedSignupCodeRequest,
  buildGetPhoneNumberPlatformRequest,
  buildSubscribeAppToWabaRequest,
  parseExchangeEmbeddedSignupCodeResponse,
  parseGetPhoneNumberPlatformResponse,
  parseSubscribeAppToWabaResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { collectAllPhoneNumbers } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
import { resetWhatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import { resolveEnvConfig } from "@/backend/services/system";
import { SYNC_STATUS_PENDING } from "@/backend/services/whatsapp/whatsapp-account.constants";
import {
  embeddedSignupTokenResponseSchema,
  isValidMetaNumericId,
  phoneNumberListSchema,
  phoneNumberPlatformResponseSchema,
  subscribedAppsResponseSchema,
} from "@/backend/services/whatsapp/whatsapp-account.schemas";
import {
  auditChange,
  executeGraphApiFetch,
  maskPhoneNumber,
  WhatsappAccountValidationError,
} from "@/backend/services/whatsapp/whatsapp-account.shared.helpers";
import { WhatsappCoexistenceSyncService } from "@/backend/services/whatsapp/whatsapp-coexistence-sync.service";
import type {
  DBTransaction,
  ExchangeEmbeddedSignupCodeResponseBody,
  GetPhoneNumberPlatformResponseBody,
  GraphApiRequestContext,
  ListPhoneNumbersResponseBody,
  SubscribedAppsResponseBody,
  WhatsappAccountReturnType,
  WhatsappEmbeddedSignupSubmitInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Wraps any unknown ES-step failure in the localized domain error. */
function wrapEmbeddedSignupError(error: unknown, fallbackMessage: string, step: string): WhatsappEmbeddedSignupError {
  logger.error(
    `whatsapp-account-service: embedded signup ${step} failed: ${error instanceof Error ? error.message : String(error)}`,
    { step, error }
  );
  return new WhatsappEmbeddedSignupError(fallbackMessage, {
    cause: error instanceof Error ? error : undefined,
  });
}

/** Exchanges the single-use ES authorization code for a business-integration token. */
async function exchangeEmbeddedSignupCode(
  code: string,
  appId: string,
  appSecret: string,
  apiVersion: string,
  failureMessage: string
): Promise<string> {
  try {
    const request = buildExchangeEmbeddedSignupCodeRequest(apiVersion, { appId, appSecret, code });
    const body = await executeGraphApiFetch<ExchangeEmbeddedSignupCodeResponseBody>(
      request,
      embeddedSignupTokenResponseSchema
    );
    return parseExchangeEmbeddedSignupCodeResponse(body).accessToken;
  } catch (error) {
    throw wrapEmbeddedSignupError(error, failureMessage, "codeExchange");
  }
}

/**
 * Resolves the phone number for the onboarding WABA. When the client session
 * supplied a `phoneNumberId` it wins; otherwise the WABA's phone list is read
 * (must contain exactly one number to be unambiguous).
 */
async function resolveEmbeddedSignupPhoneNumber(
  ctx: GraphApiRequestContext,
  wabaId: string,
  phoneNumberId: string | undefined,
  failureMessage: string
): Promise<{ phoneNumberId: string; displayPhoneNumber: string | null }> {
  if (phoneNumberId) {
    return { phoneNumberId, displayPhoneNumber: null };
  }
  try {
    const phones = await collectAllPhoneNumbers(ctx, { wabaId }, request =>
      executeGraphApiFetch<ListPhoneNumbersResponseBody>(request, phoneNumberListSchema)
    );
    if (phones.length !== 1) {
      throw new WhatsappEmbeddedSignupError(failureMessage);
    }
    return { phoneNumberId: phones[0].id, displayPhoneNumber: phones[0].display_phone_number ?? null };
  } catch (error) {
    throw wrapEmbeddedSignupError(error, failureMessage, "phoneResolution");
  }
}

/**
 * Confirms the coexistence preconditions on the resolved number: the business
 * app must still be installed (`is_on_biz_app`) and the number must be
 * Cloud-API reachable (`platform_type === "CLOUD_API"`).
 */
async function confirmEmbeddedSignupCoexistence(
  ctx: GraphApiRequestContext,
  phoneNumberId: string,
  failureMessage: string
): Promise<string | null> {
  try {
    const request = buildGetPhoneNumberPlatformRequest(ctx, { phoneNumberId });
    const body = await executeGraphApiFetch<GetPhoneNumberPlatformResponseBody>(
      request,
      phoneNumberPlatformResponseSchema
    );
    const platform = parseGetPhoneNumberPlatformResponse(body);
    if (!platform.isOnBizApp || platform.platformType !== "CLOUD_API") {
      throw new WhatsappEmbeddedSignupError(failureMessage);
    }
    return platform.displayPhoneNumber;
  } catch (error) {
    throw wrapEmbeddedSignupError(error, failureMessage, "coexistenceConfirm");
  }
}

/**
 * Attaches the app to the WABA. A failure here is not onboarding-blocking —
 * the account exists; the missing subscription surfaces as a settings
 * warning instead.
 */
async function subscribeAppToWaba(ctx: GraphApiRequestContext, wabaId: string): Promise<void> {
  try {
    const request = buildSubscribeAppToWabaRequest(ctx, { wabaId });
    const body = await executeGraphApiFetch<SubscribedAppsResponseBody>(request, subscribedAppsResponseSchema);
    parseSubscribeAppToWabaResponse(body);
  } catch (error) {
    logger.warn(
      `whatsapp-account-service: subscribed_apps call failed for waba ${wabaId.slice(-4)}: ${error instanceof Error ? error.message : String(error)}`,
      { error }
    );
  }
}

/** Resolves the ES app credentials and Graph API version, or aborts onboarding. */
async function resolveSignupCredentials(
  tErrors: ErrorsLabels
): Promise<{ appId: string; appSecret: string; apiVersion: string }> {
  const appId = await resolveEnvConfig("WHATSAPP_APP_ID");
  const appSecret = await resolveEnvConfig("WHATSAPP_APP_SECRET");
  if (!appId || !appSecret) {
    logger.error("whatsapp-account-service: embedded signup aborted — app credentials not configured");
    throw new WhatsappEmbeddedSignupError(tErrors.whatsappEmbeddedSignupFailed);
  }
  const apiVersion = await resolveGraphApiVersion();
  return { appId, appSecret, apiVersion };
}

/** Rejects a duplicate signup for a phone number that already has an account. */
async function assertNoExistingSignupAccount(
  phoneNumberId: string,
  tx: DBTransaction | undefined,
  tErrors: ErrorsLabels
): Promise<void> {
  const existing = await WhatsappAccountRepository.findByPhoneNumberId(phoneNumberId, tx);
  if (existing) {
    throw wrapEmbeddedSignupError(
      new ConflictError(`WhatsApp account already exists for phoneNumberId ***${phoneNumberId.slice(-4)}`),
      tErrors.whatsappEmbeddedSignupFailed,
      "duplicateCheck"
    );
  }
}

/**
 * Creates the coexistence account row. A concurrent signup that passed the
 * duplicate pre-check loses at the unique `phone_number_id` index (SQLSTATE
 * 23505); surface the same localized onboarding failure instead of leaking
 * the raw driver error.
 */
async function createSignupAccount(params: {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  accessToken: string;
  tx: DBTransaction | undefined;
  tErrors: ErrorsLabels;
}): Promise<WhatsappAccountReturnType> {
  try {
    return await WhatsappAccountRepository.create(
      {
        wabaId: params.wabaId,
        phoneNumberId: params.phoneNumberId,
        displayPhoneNumber: params.displayPhoneNumber,
        onboardingMode: WhatsappOnboardingMode.COEXISTENCE,
        // Plaintext token — the `encryptedText` column encrypts at the driver
        // boundary (same contract as setAccessToken).
        encryptedAccessToken: params.accessToken,
        encryptedTwoStepPin: SYNC_STATUS_PENDING,
        isActive: true,
      },
      params.tx
    );
  } catch (error) {
    if (isDuplicateError(error)) {
      throw wrapEmbeddedSignupError(error, params.tErrors.whatsappEmbeddedSignupFailed, "accountCreate");
    }
    throw error;
  }
}

/**
 * Emits the onboarding audit row, resets the channel singleton, and enqueues
 * the one-shot post-onboarding sync. The account persists even when the sync
 * enqueue fails — onboarding is complete once Meta accepts the credentials.
 */
async function finalizeSignup(
  actorUserId: string,
  account: WhatsappAccountReturnType,
  displayPhoneNumber: string | null,
  wabaId: string,
  phoneNumberId: string,
  tx: DBTransaction | undefined,
  tErrors: ErrorsLabels
): Promise<void> {
  await auditChange(
    actorUserId,
    "CREATE",
    account.id,
    {
      description: `Completed WhatsApp embedded signup (coexistence) for ${maskPhoneNumber(displayPhoneNumber)}`,
      newState: { wabaId, phoneNumberId, onboardingMode: WhatsappOnboardingMode.COEXISTENCE },
    },
    tx
  );
  await resetWhatsappChannel(account.id);

  try {
    // No caller tx: the sync POSTs to Meta must never sit inside a caller
    // transaction (see the sync service's contract JSDoc).
    await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(account.id, tErrors);
  } catch (error) {
    logger.error(
      `whatsapp-account-service: post-onboarding sync enqueue failed for account ${account.id}: ${error instanceof Error ? error.message : String(error)}`,
      { accountId: account.id, error }
    );
  }
}

/**
 * Completes Embedded Signup (coexistence) onboarding end-to-end:
 * exchange the single-use code → resolve the phone number → confirm the
 * number still runs the Business app and is Cloud-API reachable → attach
 * the app to the WABA → create the account row (`onboardingMode:
 * COEXISTENCE`, business-integration token stored) → enqueue the one-shot
 * contacts/history sync. The account persists even when the sync enqueue
 * fails — onboarding is complete once Meta accepts the credentials.
 *
 * The authorization code is single-use: a replayed or expired code fails
 * the Meta exchange call and surfaces as `whatsapp.embeddedSignupFailed`.
 */
export async function completeEmbeddedSignupOp(
  actorUserId: string,
  tErrors: ErrorsLabels,
  input: WhatsappEmbeddedSignupSubmitInput,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType> {
  const code = input.code.trim();
  const wabaId = input.wabaId.trim();
  const phoneNumberId = input.phoneNumberId?.trim() ?? undefined;
  if (code.length === 0 || code.length > 2048 || !isValidMetaNumericId(wabaId)) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }
  if (phoneNumberId !== undefined && !isValidMetaNumericId(phoneNumberId)) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }

  const { appId, appSecret, apiVersion } = await resolveSignupCredentials(tErrors);
  const accessToken = await exchangeEmbeddedSignupCode(
    code,
    appId,
    appSecret,
    apiVersion,
    tErrors.whatsappEmbeddedSignupFailed
  );
  const ctx: GraphApiRequestContext = { accessToken, apiVersion };

  const resolved = await resolveEmbeddedSignupPhoneNumber(
    ctx,
    wabaId,
    phoneNumberId,
    tErrors.whatsappEmbeddedSignupFailed
  );
  const confirmedDisplayNumber = await confirmEmbeddedSignupCoexistence(
    ctx,
    resolved.phoneNumberId,
    tErrors.whatsappEmbeddedSignupFailed
  );
  const displayPhoneNumber = confirmedDisplayNumber ?? resolved.displayPhoneNumber;

  await assertNoExistingSignupAccount(resolved.phoneNumberId, tx, tErrors);
  await subscribeAppToWaba(ctx, wabaId);
  const account = await createSignupAccount({
    wabaId,
    phoneNumberId: resolved.phoneNumberId,
    displayPhoneNumber,
    accessToken,
    tx,
    tErrors,
  });
  await finalizeSignup(actorUserId, account, displayPhoneNumber, wabaId, resolved.phoneNumberId, tx, tErrors);
  return account;
}
