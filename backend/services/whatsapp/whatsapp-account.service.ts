import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { AppPermission, NotificationChannel } from "@/backend/enum";
import type { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { ForbiddenError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { resolveEnvConfig, resolveEnvConfigMany } from "@/backend/services/system";
import {
  changeAccountPurpose,
  createWhatsappAccount,
  localDeactivateAccount as deactivateAccountOp,
  persistAccountAccessToken,
  persistAccountTwoStepPin,
  testAccountAccessToken,
  updateWhatsappAccount,
} from "@/backend/services/whatsapp/whatsapp-account.account-ops.helpers";
import {
  META_APP_DASHBOARD_BASE_URL,
  WHATSAPP_ENV_BOOTSTRAP_KEYS,
} from "@/backend/services/whatsapp/whatsapp-account.constants";
import { applyUserWhatsappOptIn } from "@/backend/services/whatsapp/whatsapp-account.optin.helpers";
import { isNotificationChannel } from "@/backend/services/whatsapp/whatsapp-account.schemas";
import {
  assertCanManage,
  assertCanView,
  assertSuperAdmin,
  assertValidId,
  validateAccountConfigInternal,
} from "@/backend/services/whatsapp/whatsapp-account.shared.helpers";
import { completeEmbeddedSignupOp } from "@/backend/services/whatsapp/whatsapp-account.signup.helpers";
import { syncWhatsappAccountsFromMeta } from "@/backend/services/whatsapp/whatsapp-account.sync.helpers";
import { checkPhoneNumberStatusWithToken as checkPhoneNumberStatusWithTokenOp } from "@/backend/services/whatsapp/whatsapp-account.token-test.helpers";
import type {
  DBTransaction,
  UserPermissionContext,
  WhatsappAccessTokenTestResultType,
  WhatsappAccountCreateSubmitInput,
  WhatsappAccountReturnType,
  WhatsappAccountUpdateInput,
  WhatsappConfigurationStatusType,
  WhatsappEmbeddedSignupSubmitInput,
  WhatsappSyncFromMetaReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export {
  phoneNumberListSchema,
  phoneNumberResultSchema,
  sendTemplateMessageResponseSchema,
} from "@/backend/services/whatsapp/whatsapp-account.schemas";

type WhatsappAccessGuard = (actorUserId: string, tErrors: ErrorsLabels) => Promise<void>;

/**
 * Runs a permission guard, then delegates to the guarded operation with the
 * actor's identity and error labels. Trailing arguments (input payloads,
 * `tx`) are forwarded to the operation, so the authorization prelude lives
 * in one place instead of being repeated in every service method.
 */
async function runGuarded<A extends unknown[], R>(
  guard: WhatsappAccessGuard,
  actorUserId: string,
  tErrors: ErrorsLabels,
  op: (actorUserId: string, tErrors: ErrorsLabels, ...args: A) => Promise<R>,
  ...args: A
): Promise<R> {
  await guard(actorUserId, tErrors);
  return op(actorUserId, tErrors, ...args);
}

/**
 * Runs a permission guard, validates the account id, then delegates to the
 * guarded operation. Validation order matters: the permission check runs
 * before id validation so unauthorized callers learn nothing about id shape.
 */
async function runGuardedId<A extends unknown[], R>(
  guard: WhatsappAccessGuard,
  actorUserId: string,
  tErrors: ErrorsLabels,
  id: string,
  op: (actorUserId: string, tErrors: ErrorsLabels, id: string, ...args: A) => Promise<R>,
  ...args: A
): Promise<R> {
  await guard(actorUserId, tErrors);
  assertValidId(id, tErrors);
  return op(actorUserId, tErrors, id, ...args);
}

export namespace WhatsappAccountService {
  /**
   * All accounts for the numbers management surface — active and inactive.
   * Synced numbers are created inactive (credentials pending), so an
   * active-only list would make the sync flow appear to add nothing.
   */
  export async function listAccounts(
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType[]> {
    return runGuarded(assertCanView, actorUserId, tErrors, () => WhatsappAccountRepository.listAll(tx));
  }

  export async function getAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return runGuardedId(assertCanView, actorUserId, tErrors, id, () => WhatsappAccountRepository.findById(id, tx));
  }

  export async function createAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    input: WhatsappAccountCreateSubmitInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    return runGuarded(assertCanManage, actorUserId, tErrors, createWhatsappAccount, input, tx);
  }

  export async function updateAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    input: WhatsappAccountUpdateInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return runGuardedId(assertCanManage, actorUserId, tErrors, id, updateWhatsappAccount, input, tx);
  }

  /**
   * Assign or change the routing purpose of an account
   * (`WHATSAPP_CONFIG_MANAGE`; permission context passed in from the caller so
   * no extra user-context DB query happens). Purpose assignment on an inactive
   * account is rejected — routing only considers active rows, so assigning a
   * purpose to an inactive account would silently misroute sends.
   */
  export async function updateAccountPurpose(
    actorUserId: string,
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    id: string,
    purpose: WhatsappAccountPurpose,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_CONFIG_MANAGE);
    if (!ok) {
      throw new ForbiddenError(tErrors.insufficientPermissions);
    }
    assertValidId(id, tErrors);
    return changeAccountPurpose(actorUserId, tErrors, id, purpose, tx);
  }

  /**
   * Stop using a WhatsApp number: deactivate it while leaving its stored
   * messages and inbox conversations untouched. The account row itself is
   * kept (the number stays on the system and on Meta) and remains listed as
   * inactive.
   */
  export async function localDeactivateAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return runGuardedId(assertCanManage, actorUserId, tErrors, id, () => deactivateAccountOp(actorUserId, id, tx));
  }

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
    return checkPhoneNumberStatusWithTokenOp(phoneNumberId, accessToken, apiVersion);
  }

  /**
   * Validates an access token against Meta for the account's phone number
   * WITHOUT persisting anything — the UI calls this from the token dialog's
   * "Test" action to gate the "Save" action on a confirmed-valid token.
   *
   * @throws NotFoundError when the account row does not exist.
   */
  export async function testAccessToken(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    accessToken: string
  ): Promise<WhatsappAccessTokenTestResultType> {
    return runGuardedId(assertCanManage, actorUserId, tErrors, id, () =>
      testAccountAccessToken(tErrors, id, accessToken)
    );
  }

  export async function setAccessToken(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    accessToken: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return runGuardedId(assertSuperAdmin, actorUserId, tErrors, id, persistAccountAccessToken, accessToken, tx);
  }

  export async function setTwoStepPin(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    twoStepPin: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return runGuardedId(assertSuperAdmin, actorUserId, tErrors, id, persistAccountTwoStepPin, twoStepPin, tx);
  }

  export async function syncFromMeta(
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<WhatsappSyncFromMetaReturnType> {
    return runGuarded(assertCanManage, actorUserId, tErrors, syncWhatsappAccountsFromMeta, tx);
  }

  /**
   * Completes Embedded Signup (coexistence) onboarding end-to-end: the code
   * exchange, phone resolution, coexistence confirmation, WABA subscription,
   * account creation, and the one-shot post-onboarding sync enqueue.
   * The authorization code is single-use: a replayed or expired code fails
   * the Meta exchange call and surfaces as `whatsapp.embeddedSignupFailed`.
   */
  export async function completeEmbeddedSignup(
    actorUserId: string,
    tErrors: ErrorsLabels,
    input: WhatsappEmbeddedSignupSubmitInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    return runGuarded(assertCanManage, actorUserId, tErrors, completeEmbeddedSignupOp, input, tx);
  }

  /** Per-account health hook: validates that the channel for a single account can resolve credentials. */
  export async function validateAccountConfig(accountId: string): Promise<boolean> {
    return validateAccountConfigInternal(accountId);
  }

  /**
   * Deep link to the Meta App Dashboard "Facebook Login for Business" settings
   * panel (Client OAuth settings → Allowed domains / Valid OAuth redirect URIs),
   * derived from the configured WhatsApp app id. Embedded Signup only returns
   * the onboarding code to pages hosted on registered origins. Returns null
   * when the app id is not configured.
   */
  export async function resolveEmbeddedSignupAllowedOriginsUrl(): Promise<string | null> {
    const appId = await resolveEnvConfig("WHATSAPP_APP_ID");
    if (!appId) {
      return null;
    }
    return `${META_APP_DASHBOARD_BASE_URL}/${appId}/fb-business-login/settings/`;
  }

  /**
   * Reports how WhatsApp Cloud API configuration is satisfied.
   *
   * WhatsApp is considered configured when at least one active account
   * resolves healthy credentials OR the env-bootstrap path is fully configured
   * (both `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_WABA_ID` resolve non-empty) —
   * the bootstrap path is what powers the very first `syncFromMeta` when no
   * account rows exist yet. `missingEnvKeys` is computed independently of
   * account validity so callers can always explain the env-bootstrap state.
   */
  export async function getConfigurationStatus(): Promise<WhatsappConfigurationStatusType> {
    const [accounts, envValues] = await Promise.all([
      WhatsappAccountRepository.listActive(),
      resolveEnvConfigMany([...WHATSAPP_ENV_BOOTSTRAP_KEYS]),
    ]);
    const missingEnvKeys = WHATSAPP_ENV_BOOTSTRAP_KEYS.filter(key => !envValues[key]?.trim());
    const envBootstrapAvailable = missingEnvKeys.length === 0;

    let hasValidAccount = false;
    if (accounts.length > 0) {
      const results = await Promise.all(accounts.map(account => validateAccountConfigInternal(account.id)));
      hasValidAccount = results.some(Boolean);
    }

    return {
      isConfigured: hasValidAccount || envBootstrapAvailable,
      envBootstrapAvailable,
      missingEnvKeys,
    };
  }

  /**
   * Aggregate configuration check across accounts and the env-bootstrap path.
   * Thin wrapper over {@link getConfigurationStatus}.
   */
  export async function isConfigured(): Promise<boolean> {
    const status = await getConfigurationStatus();
    return status.isConfigured;
  }

  export async function isUserWhatsappOptIn(userId: string, tx?: DBTransaction): Promise<boolean> {
    const prefs = await NotificationPreferencesRepository.getByUserId(userId, tx);
    // REQ-10: WhatsApp defaults to OFF — only return true if explicit WHATSAPP prefs exist and all are enabled
    const whatsappPrefs = prefs.filter(
      p => isNotificationChannel(p.channel) && p.channel === NotificationChannel.WHATSAPP
    );
    if (whatsappPrefs.length === 0) {
      return false;
    }
    return whatsappPrefs.every(p => p.enabled);
  }

  /** System-initiated account update (webhook handler) — no actor, no audit at service level. */
  export async function systemUpdateAccount(
    id: string,
    input: WhatsappAccountUpdateInput,
    tx?: DBTransaction
  ): Promise<boolean> {
    const result = await WhatsappAccountRepository.update(id, input, tx);
    return result !== null;
  }

  /** System-initiated find by phone number (webhook handler). */
  export async function systemFindByPhoneNumberId(
    phoneNumberId: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return WhatsappAccountRepository.findByPhoneNumberId(phoneNumberId, tx);
  }

  export async function setUserWhatsappOptIn(
    actorUserId: string,
    tErrors: ErrorsLabels,
    userId: string,
    enabled: boolean,
    source: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return applyUserWhatsappOptIn(actorUserId, tErrors, userId, enabled, source, tx);
  }
}
