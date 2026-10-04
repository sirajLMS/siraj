import { db } from "@/backend/db/drizzleDb";
import { BillingRepository, UserPaymentMethodRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { logger } from "@/backend/lib/logger";
import { userPaymentMethodSubmitInputSchema } from "@/backend/lib/payment-method.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import { buildPaymentMethodChangedPayloads } from "@/backend/services/notification/notification-payloads.builders";
import {
  assertActorCanManageTarget,
  assertCatalogActive,
  encryptDetailsForStorage,
  getPaymentMethodOrThrow,
  slotsForDirection,
} from "@/backend/services/payment-method/payment-method.helpers";
import { PaymentMethodInternal } from "@/backend/services/payment-method/payment-method.internal";
import { PaymentMethodPayments } from "@/backend/services/payment-method/payment-method.payments";
import { PaymentMethodReads } from "@/backend/services/payment-method/payment-method.reads";
import { PaymentMethodSeed } from "@/backend/services/payment-method/payment-method.seed.helpers";
import { buildMaskedPaymentMethod } from "@/backend/services/payment-method/payment-method-mask";
import type * as Types from "@/backend/types";
import type {
  DBTransaction,
  UpdateUserPaymentMethodInput,
  UserPaymentMethodReturnType,
  UserPaymentMethodSubmitInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace PaymentMethodService {
  async function dispatchPaymentMethodNotification(
    userId: string,
    action: "created" | "updated" | "deleted" | "setDefault" | "verified",
    locale: string | undefined,
    metadata?: Record<string, string>
  ): Promise<void> {
    if (!userId) return;
    const payloads = buildPaymentMethodChangedPayloads(userId, action, locale, metadata);
    await dispatchWithPreferences(payloads, [userId], locale).catch(err => {
      logger.error("Payment-method notification failed", { err, action, userId });
    });
  }

  export const listUserPaymentMethods = PaymentMethodReads.listUserPaymentMethods;
  export const getUserPaymentMethod = PaymentMethodReads.getUserPaymentMethod;
  export const listForProfile = PaymentMethodReads.listForProfile;
  export const getDefaultsForProfile = PaymentMethodReads.getDefaultsForProfile;

  export async function createUserPaymentMethod(
    actorUserId: string,
    input: UserPaymentMethodSubmitInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const targetUserId = input.userId ?? actorUserId;
    await assertActorCanManageTarget(actorUserId, targetUserId, tErrors);
    const parsed = userPaymentMethodSubmitInputSchema.parse({ ...input, userId: targetUserId });
    const encryptedDetails = encryptDetailsForStorage(parsed.type, input.details);

    const run = async (t: DBTransaction) => {
      await assertCatalogActive(parsed.type, input.details, tErrors, t);

      if (parsed.isDefault) {
        await Promise.all(
          slotsForDirection(parsed.direction).map(slot =>
            UserPaymentMethodRepository.clearDefaultsInSlot(parsed.userId, slot, t)
          )
        );
      }

      const created = await UserPaymentMethodRepository.create(
        {
          ...parsed,
          details: encryptedDetails,
        },
        t
      );

      return buildMaskedPaymentMethod(created, true);
    };

    const result = tx ? await run(tx) : await db.transaction(run);
    await dispatchPaymentMethodNotification(parsed.userId, "created", undefined, {
      identifier: result.id,
    });
    return result;
  }

  export async function updateUserPaymentMethod(
    actorUserId: string,
    id: string,
    input: UpdateUserPaymentMethodInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const result = await updateUserPaymentMethodCore(actorUserId, id, input, tErrors, tx);
    await dispatchPaymentMethodNotification(result.userId, "updated", undefined, {
      identifier: result.id,
    });
    return result;
  }

  async function updateUserPaymentMethodCore(
    actorUserId: string,
    id: string,
    input: UpdateUserPaymentMethodInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const existing = await getPaymentMethodOrThrow(id, tErrors, tx);

    await assertActorCanManageTarget(actorUserId, existing.userId, tErrors);

    const run = async (t: DBTransaction) => {
      const inputDetails = input.details;
      const details = inputDetails ? encryptDetailsForStorage(existing.type, inputDetails) : undefined;

      if (inputDetails !== undefined) {
        await assertCatalogActive(existing.type, inputDetails, tErrors, t);
      }

      const direction = input.direction ?? existing.direction;
      if (input.isDefault) {
        await Promise.all(
          slotsForDirection(direction).map(slot =>
            UserPaymentMethodRepository.clearDefaultsInSlot(existing.userId, slot, t)
          )
        );
      }

      const updated = await UserPaymentMethodRepository.update(
        id,
        {
          ...input,
          ...(details ? { details } : {}),
        },
        tErrors,
        t
      );

      return buildMaskedPaymentMethod(updated, true);
    };

    return tx ? run(tx) : db.transaction(run);
  }

  export async function deleteUserPaymentMethod(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<void> {
    const existing = await getPaymentMethodOrThrow(id, tErrors, tx);

    await assertActorCanManageTarget(actorUserId, existing.userId, tErrors);
    await UserPaymentMethodRepository.deleteById(id, tErrors, tx);
    await dispatchPaymentMethodNotification(existing.userId, "deleted", undefined, {
      identifier: existing.id,
    });
  }

  export async function setDefaultUserPaymentMethod(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const existing = await getPaymentMethodOrThrow(id, tErrors, tx);

    const result = await updateUserPaymentMethodCore(
      actorUserId,
      id,
      { isDefault: true, direction: existing.direction },
      tErrors,
      tx
    );
    await dispatchPaymentMethodNotification(existing.userId, "setDefault", undefined, {
      identifier: result.id,
      newDefaultId: result.id,
    });
    return result;
  }

  export async function verifyBankTransferPaymentMethod(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.PAYMENT_METHODS_VERIFY_BANK_TRANSFER
    );
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    const existing = await getPaymentMethodOrThrow(id, tErrors, tx);

    if (existing.type !== PaymentMethodType.BANK_TRANSFER) {
      throw new Error(tErrors.billing.invoiceAlreadyPaid({ id, status: "PAID" }));
    }

    const verified = await UserPaymentMethodRepository.setVerified(id, actorUserId, tErrors, tx);
    const result = buildMaskedPaymentMethod(verified, true);
    await dispatchPaymentMethodNotification(existing.userId, "verified", undefined, {
      identifier: result.id,
    });
    return result;
  }

  export const recordPayin = PaymentMethodPayments.recordPayin;
  export const recordPayout = PaymentMethodPayments.recordPayout;

  export const createUserPaymentMethodInternal = PaymentMethodInternal.createUserPaymentMethodInternal;

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function findPaymentsByIdempotencyKeys(keys: readonly string[], tx?: DBTransaction) {
    return BillingRepository.findPaymentsByIdempotencyKeys(keys, tx);
  }

  export async function createManyPayments(inputs: readonly Types.PaymentRecordInput[], tx?: DBTransaction) {
    return BillingRepository.upsertManyPayments(inputs, tx);
  }

  export const seedDemoUserPaymentMethods = PaymentMethodSeed.seedDemoUserPaymentMethods;
}
