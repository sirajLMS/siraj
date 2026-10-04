import { db } from "@/backend/db/drizzleDb";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import type { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { NotFoundError, WhatsappPurposeRequiresActiveError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { resolveGraphApiVersion } from "@/backend/lib/whatsapp-constants";
import { resetWhatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { SYNC_STATUS_PENDING } from "@/backend/services/whatsapp/whatsapp-account.constants";
import {
  auditChange,
  maskPhoneNumber,
  WhatsappAccountValidationError,
} from "@/backend/services/whatsapp/whatsapp-account.shared.helpers";
import {
  checkPhoneNumberStatusWithToken,
  checkPhoneNumberWithReason,
} from "@/backend/services/whatsapp/whatsapp-account.token-test.helpers";
import type {
  DBTransaction,
  WhatsappAccessTokenTestResultType,
  WhatsappAccountCreateSubmitInput,
  WhatsappAccountReturnType,
  WhatsappAccountUpdateInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Creates a WhatsApp account row, forcing `isActive=false` when no credentials were supplied. */
export async function createWhatsappAccount(
  actorUserId: string,
  tErrors: ErrorsLabels,
  input: WhatsappAccountCreateSubmitInput,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType> {
  // r10-039: Service-layer length validation for wabaId/phoneNumberId.
  if (input.wabaId.length > 64) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }
  if (input.phoneNumberId.length > 64) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }

  // The schema has NOT NULL on encryptedAccessToken/encryptedTwoStepPin.
  // Credentials are set via dedicated mutations (setAccessToken/setTwoStepPin).
  // Use a "pending" placeholder instead of empty string so the row is
  // distinguishable from a credential that was explicitly set to "".
  // An account must NOT be active without credentials — if no credentials
  // are provided and isActive is requested, force it to false.
  const hasAccessToken =
    "encryptedAccessToken" in input &&
    typeof input.encryptedAccessToken === "string" &&
    input.encryptedAccessToken.trim().length > 0;
  const effectiveIsActive = hasAccessToken ? input.isActive : false;
  if (input.isActive && !hasAccessToken) {
    const accountIdentifier = input.displayPhoneNumber
      ? maskPhoneNumber(input.displayPhoneNumber)
      : `phoneNumberId=***${input.phoneNumberId.slice(-4)}`;
    logger.warn(
      `whatsapp-account-service: createAccount for ${accountIdentifier} requested isActive=true but no accessToken provided — defaulting to isActive=false`
    );
  }

  const account = await WhatsappAccountRepository.create(
    {
      ...input,
      isActive: effectiveIsActive,
      encryptedAccessToken: SYNC_STATUS_PENDING,
      encryptedTwoStepPin: SYNC_STATUS_PENDING,
    },
    tx
  );
  await auditChange(
    actorUserId,
    "CREATE",
    account.id,
    {
      description: `Created WhatsApp account for ${maskPhoneNumber(input.displayPhoneNumber)}${effectiveIsActive !== input.isActive ? " (isActive forced to false: no credentials)" : ""}`,
      newState: { wabaId: input.wabaId, phoneNumberId: input.phoneNumberId, isActive: effectiveIsActive },
    },
    tx
  );
  return account;
}

/** Updates a WhatsApp account row and emits the update audit row. */
export async function updateWhatsappAccount(
  actorUserId: string,
  tErrors: ErrorsLabels,
  id: string,
  input: WhatsappAccountUpdateInput,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  // r10-039: Service-layer length validation for wabaId/phoneNumberId.
  // WhatsappAccountUpdateInput is Partial, so fields may be omitted/undefined.
  if (input.wabaId !== undefined && input.wabaId.length > 64) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }
  if (input.phoneNumberId !== undefined && input.phoneNumberId.length > 64) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }

  const runner = async (t: DBTransaction) => {
    const previous = await WhatsappAccountRepository.findById(id, t);
    const updated = await WhatsappAccountRepository.update(id, input, t);
    if (updated) {
      await auditChange(
        actorUserId,
        "UPDATE",
        id,
        {
          description: `Updated WhatsApp account ${id}`,
          previousState: previous ? { ...previous } : null,
          newState: { ...input },
        },
        t
      );
      await resetWhatsappChannel(id);
    }
    return updated;
  };

  return tx ? await runner(tx) : await db.transaction(runner);
}

/** Assigns a routing purpose to an active account and emits the update audit row. */
export async function changeAccountPurpose(
  actorUserId: string,
  tErrors: ErrorsLabels,
  id: string,
  purpose: WhatsappAccountPurpose,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType> {
  const runner = async (t: DBTransaction): Promise<WhatsappAccountReturnType> => {
    const previous = await WhatsappAccountRepository.findById(id, t);
    if (!previous) {
      throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(id));
    }
    if (!previous.isActive) {
      throw new WhatsappPurposeRequiresActiveError(tErrors.whatsappPurposeRequiresActive);
    }
    const updated = await WhatsappAccountRepository.update(id, { purpose }, t);
    if (!updated) {
      throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(id));
    }
    await auditChange(
      actorUserId,
      "UPDATE",
      id,
      {
        description: `Updated WhatsApp account ${id} purpose to ${purpose}`,
        previousState: { purpose: previous.purpose },
        newState: { purpose },
      },
      t
    );
    await resetWhatsappChannel(id);
    return updated;
  };

  return tx ? await runner(tx) : await db.transaction(runner);
}

/** Deactivates an account while leaving its stored messages and conversations untouched. */
export async function localDeactivateAccount(
  actorUserId: string,
  id: string,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  const runner = async (t: DBTransaction) => {
    const previous = await WhatsappAccountRepository.findById(id, t);
    const deactivated = await WhatsappAccountRepository.deactivateById(id, t);
    if (deactivated) {
      await auditChange(
        actorUserId,
        "DELETE",
        id,
        {
          description: `Deactivated WhatsApp account ${id}`,
          previousState: previous ? { ...previous } : null,
        },
        t
      );
      await resetWhatsappChannel(id);
    }
    return deactivated;
  };

  return tx ? await runner(tx) : await db.transaction(runner);
}

/** Validates an access token against Meta for the account's number without persisting anything. */
export async function testAccountAccessToken(
  tErrors: ErrorsLabels,
  id: string,
  accessToken: string
): Promise<WhatsappAccessTokenTestResultType> {
  const account = await WhatsappAccountRepository.findById(id);
  if (!account) {
    throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(id));
  }

  const apiVersion = await resolveGraphApiVersion();
  const verification = await checkPhoneNumberWithReason(account.phoneNumberId, accessToken, apiVersion);
  return {
    isValid: verification.isValid,
    isConnected: verification.isConnected,
    status: verification.status,
    reason: verification.reason,
    failureKind: verification.failureKind,
  };
}

/**
 * Persists a rotated access token and refreshes the derived Meta connection
 * status. The system `isActive` toggle is left untouched — it is
 * user-controlled and separate from Meta connectivity.
 */
export async function persistAccountAccessToken(
  actorUserId: string,
  tErrors: ErrorsLabels,
  id: string,
  accessToken: string,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  if (typeof accessToken !== "string" || accessToken.trim().length < 10) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }
  // S4: The accessToken is passed as plaintext to the repo.
  // The `encryptedText` custom Drizzle type auto-encrypts at the driver boundary
  // via field-encryption.ts — the service layer never handles raw ciphertext.
  const trimmedToken = accessToken.trim();
  if (trimmedToken.length > 512) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }

  const existingAccount = await WhatsappAccountRepository.findById(id, tx);
  let metaStatus: string | null | undefined;
  if (existingAccount) {
    const apiVersion = await resolveGraphApiVersion();
    const verification = await checkPhoneNumberStatusWithToken(existingAccount.phoneNumberId, trimmedToken, apiVersion);
    metaStatus = verification.isValid ? (verification.status ?? null) : null;
  }

  const updated = await WhatsappAccountRepository.setAccessToken(
    // The field is named `encryptedAccessToken` per the repo/schema contract.
    // The value passed here is plaintext — encryption is handled by the
    // `encryptedText` Drizzle custom type at the toDriver boundary
    // (field-encryption.ts), so the service layer never handles ciphertext.
    { id, encryptedAccessToken: trimmedToken, metaStatus },
    tx
  );
  if (updated) {
    await auditChange(
      actorUserId,
      "UPDATE",
      id,
      {
        description: `Updated access token for WhatsApp account ${id}`,
        previousState: { accessToken: "***" },
        newState: { accessToken: "***" },
      },
      tx
    );
    await resetWhatsappChannel(id);
  }
  return updated;
}

/** Persists a rotated two-step PIN (6-16 digits) and emits the update audit row. */
export async function persistAccountTwoStepPin(
  actorUserId: string,
  tErrors: ErrorsLabels,
  id: string,
  twoStepPin: string,
  tx?: DBTransaction
): Promise<WhatsappAccountReturnType | null> {
  // r4-sd-07: Two-step PIN must be 6-16 digits, numeric only.
  if (
    typeof twoStepPin !== "string" ||
    twoStepPin.trim().length < 6 ||
    twoStepPin.trim().length > 16 ||
    !/^\d+$/.test(twoStepPin.trim())
  ) {
    throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
  }
  const updated = await WhatsappAccountRepository.setTwoStepPin({ id, encryptedTwoStepPin: twoStepPin.trim() }, tx);
  if (updated) {
    await auditChange(
      actorUserId,
      "UPDATE",
      id,
      {
        description: `Updated two-step PIN for WhatsApp account ${id}`,
        previousState: { twoStepPin: "***" },
        newState: { twoStepPin: "***" },
      },
      tx
    );
    await resetWhatsappChannel(id);
  }
  return updated;
}
