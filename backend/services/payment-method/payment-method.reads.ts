import { UserPaymentMethodRepository } from "@/backend/db/repo";
import { AppPermission, ProfileScope } from "@/backend/enum";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  assertActorCanManageTarget,
  hasAdminPaymentAccess,
} from "@/backend/services/payment-method/payment-method.helpers";
import {
  buildMaskedPaymentMethod,
  buildMaskedPaymentMethods,
} from "@/backend/services/payment-method/payment-method-mask";
import type { PaymentMethodDefaults, UserPaymentMethodReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace PaymentMethodReads {
  export async function listUserPaymentMethods(
    actorUserId: string,
    userId: string,
    direction?: PaymentDirection,
    _locale?: string
  ): Promise<UserPaymentMethodReturnType[]> {
    // H4 fix: prevent cross-user payment method enumeration.
    const tErrors = getServerTranslations(_locale ?? "en").errorsTranslations;
    await assertActorCanManageTarget(actorUserId, userId, tErrors);
    const revealSensitive = actorUserId === userId || (await hasAdminPaymentAccess(actorUserId));
    const rows = await UserPaymentMethodRepository.listByUserId(userId);
    const filtered = direction
      ? rows.filter(row => row.direction === direction || row.direction === PaymentDirection.BOTH)
      : rows;
    return buildMaskedPaymentMethods(filtered, revealSensitive);
  }

  export async function getUserPaymentMethod(
    actorUserId: string,
    id: string,
    locale?: string
  ): Promise<UserPaymentMethodReturnType | null> {
    const existing = await UserPaymentMethodRepository.getById(id);
    if (!existing) {
      return null;
    }
    const methods = await listUserPaymentMethods(actorUserId, existing.userId, undefined, locale);
    return methods.find(method => method.id === id) ?? null;
  }

  export async function listForProfile(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    _locale?: string
  ): Promise<UserPaymentMethodReturnType[] | null> {
    if (scope === ProfileScope.OWN && actorUserId !== targetUserId) {
      return null;
    }

    const revealSensitive = actorUserId === targetUserId;
    if (!revealSensitive) {
      const canView = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.PROFILE_PAYMENT_METHODS_VIEW_OTHER
      );
      if (!canView) {
        return null;
      }
    }

    const rows = await UserPaymentMethodRepository.listByUserId(targetUserId);
    return buildMaskedPaymentMethods(rows, revealSensitive);
  }

  export async function getDefaultsForProfile(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    locale?: string
  ): Promise<PaymentMethodDefaults | null> {
    const methods = await listForProfile(actorUserId, targetUserId, scope, locale);
    if (methods === null) {
      return null;
    }

    const revealSensitive = actorUserId === targetUserId;
    const payinDefault = await UserPaymentMethodRepository.findDefaultForSlot(targetUserId, "PAYIN");
    const payoutDefault = await UserPaymentMethodRepository.findDefaultForSlot(targetUserId, "PAYOUT");

    return {
      payinDefault: payinDefault ? buildMaskedPaymentMethod(payinDefault, revealSensitive) : null,
      payoutDefault: payoutDefault ? buildMaskedPaymentMethod(payoutDefault, revealSensitive) : null,
    };
  }
}
