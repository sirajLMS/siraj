import {
  SupportedMobileWalletRepository,
  SupportedOnlineAccountRepository,
  SupportedPaymentLinkRepository,
} from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import type { CountryCode } from "@/backend/enum";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  SupportedMobileWalletReturnType,
  SupportedMobileWalletSubmitInput,
  SupportedOnlineAccountSubmitInput,
  SupportedPaymentLinkSubmitInput,
  UpdateSupportedMobileWalletInput,
  UpdateSupportedOnlineAccountInput,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types/billing/payment-method.types";

async function assertCatalogAdmin(actorUserId: string, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.PAYMENT_METHODS_MANAGE_CATALOGS
  );
  if (!hasPermission) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }
}

export namespace PaymentCatalogService {
  export async function listMobileWallets(
    actorUserId: string,
    filters?: { countryCode?: CountryCode; direction?: PaymentDirection },
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedMobileWalletRepository.listActive(filters ?? {}, undefined);
  }

  export async function createMobileWallet(
    actorUserId: string,
    input: SupportedMobileWalletSubmitInput,
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedMobileWalletRepository.create(input, undefined);
  }

  export async function updateMobileWallet(
    actorUserId: string,
    id: string,
    input: UpdateSupportedMobileWalletInput,
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedMobileWalletRepository.update(id, input, undefined, locale);
  }

  export async function deactivateMobileWallet(actorUserId: string, id: string, locale?: string) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedMobileWalletRepository.deactivate(id, undefined, locale);
  }

  export async function listPaymentLinks(
    actorUserId: string,
    filters?: { direction?: PaymentDirection },
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedPaymentLinkRepository.listActive(filters ?? {}, undefined);
  }

  export async function createPaymentLink(
    actorUserId: string,
    input: SupportedPaymentLinkSubmitInput,
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedPaymentLinkRepository.create(input, undefined);
  }

  export async function updatePaymentLink(
    actorUserId: string,
    id: string,
    input: UpdateSupportedPaymentLinkInput,
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedPaymentLinkRepository.update(id, input, undefined, locale);
  }

  export async function deactivatePaymentLink(actorUserId: string, id: string, locale?: string) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedPaymentLinkRepository.deactivate(id, undefined, locale);
  }

  export async function listOnlineAccounts(
    actorUserId: string,
    filters?: { direction?: PaymentDirection },
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedOnlineAccountRepository.listActive(filters ?? {}, undefined);
  }

  export async function createOnlineAccount(
    actorUserId: string,
    input: SupportedOnlineAccountSubmitInput,
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedOnlineAccountRepository.create(input, undefined);
  }

  export async function updateOnlineAccount(
    actorUserId: string,
    id: string,
    input: UpdateSupportedOnlineAccountInput,
    locale?: string
  ) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedOnlineAccountRepository.update(id, input, undefined, locale);
  }

  export async function deactivateOnlineAccount(actorUserId: string, id: string, locale?: string) {
    await assertCatalogAdmin(actorUserId, locale);
    return SupportedOnlineAccountRepository.deactivate(id, undefined, locale);
  }
}
