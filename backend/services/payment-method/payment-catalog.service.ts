import type { DBTransaction } from "@/backend/db/db.types";
import {
  SupportedMobileWalletRepository,
  SupportedOnlineAccountRepository,
  SupportedPaymentLinkRepository,
} from "@/backend/db/repo";
import type { CountryCode } from "@/backend/enum";
import { AppPermission } from "@/backend/enum";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  SupportedMobileWalletInsertType,
  SupportedMobileWalletSubmitInput,
  SupportedOnlineAccountInsertType,
  SupportedOnlineAccountSubmitInput,
  SupportedPaymentLinkInsertType,
  SupportedPaymentLinkSubmitInput,
  UpdateSupportedMobileWalletInput,
  UpdateSupportedOnlineAccountInput,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types/billing/payment-method.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

async function assertCatalogAdmin(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.PAYMENT_METHODS_MANAGE_CATALOGS
  );
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

export namespace PaymentCatalogService {
  // ─── Mobile Wallets ──────────────────────────────────────────────────────
  export async function listMobileWallets(
    actorUserId: string,
    tErrors: ErrorsLabels,
    filters?: { countryCode?: CountryCode; direction?: PaymentDirection; activeOnly?: boolean }
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    if (filters?.activeOnly === false) {
      return SupportedMobileWalletRepository.listAll(undefined);
    }
    return SupportedMobileWalletRepository.listActive(
      { countryCode: filters?.countryCode, direction: filters?.direction },
      undefined
    );
  }

  export async function createMobileWallet(
    actorUserId: string,
    input: SupportedMobileWalletSubmitInput,
    tErrors: ErrorsLabels
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedMobileWalletRepository.create(input, undefined);
  }

  export async function updateMobileWallet(
    actorUserId: string,
    id: string,
    input: UpdateSupportedMobileWalletInput,
    tErrors: ErrorsLabels
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedMobileWalletRepository.update(id, input, undefined, tErrors);
  }

  export async function deactivateMobileWallet(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedMobileWalletRepository.deactivate(id, undefined, tErrors);
  }

  // ─── Payment Links ───────────────────────────────────────────────────────
  export async function listPaymentLinks(
    actorUserId: string,
    tErrors: ErrorsLabels,
    filters?: { direction?: PaymentDirection; activeOnly?: boolean }
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    if (filters?.activeOnly !== false) {
      return SupportedPaymentLinkRepository.listActive({ direction: filters?.direction }, undefined);
    }
    return SupportedPaymentLinkRepository.listAll(undefined);
  }

  export async function createPaymentLink(
    actorUserId: string,
    input: SupportedPaymentLinkSubmitInput,
    tErrors: ErrorsLabels
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedPaymentLinkRepository.create(input, undefined);
  }

  export async function updatePaymentLink(
    actorUserId: string,
    id: string,
    input: UpdateSupportedPaymentLinkInput,
    tErrors: ErrorsLabels
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedPaymentLinkRepository.update(id, input, undefined, tErrors);
  }

  export async function deactivatePaymentLink(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedPaymentLinkRepository.deactivate(id, undefined, tErrors);
  }

  // ─── Online Accounts ─────────────────────────────────────────────────────
  export async function listOnlineAccounts(
    actorUserId: string,
    tErrors: ErrorsLabels,
    filters?: { direction?: PaymentDirection; activeOnly?: boolean }
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    const showAll = filters?.activeOnly === false;
    return showAll
      ? SupportedOnlineAccountRepository.listAll(undefined)
      : SupportedOnlineAccountRepository.listActive({ direction: filters?.direction }, undefined);
  }

  export async function createOnlineAccount(
    actorUserId: string,
    input: SupportedOnlineAccountSubmitInput,
    tErrors: ErrorsLabels
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedOnlineAccountRepository.create(input, undefined);
  }

  export async function updateOnlineAccount(
    actorUserId: string,
    id: string,
    input: UpdateSupportedOnlineAccountInput,
    tErrors: ErrorsLabels
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedOnlineAccountRepository.update(id, input, undefined, tErrors);
  }

  export async function deactivateOnlineAccount(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    await assertCatalogAdmin(actorUserId, tErrors);
    return SupportedOnlineAccountRepository.deactivate(id, undefined, tErrors);
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function listAllMobileWallets(tx?: DBTransaction) {
    return SupportedMobileWalletRepository.listAll(tx);
  }

  export async function listAllPaymentLinks(tx?: DBTransaction) {
    return SupportedPaymentLinkRepository.listAll(tx);
  }

  export async function listAllOnlineAccounts(tx?: DBTransaction) {
    return SupportedOnlineAccountRepository.listAll(tx);
  }

  async function upsertWithDuplicateFallback<T extends { slug: string }>(
    inputs: readonly T[],
    upsertMany: (items: readonly T[], tx?: DBTransaction) => Promise<T[]>,
    getBySlug: (slug: string, tx?: DBTransaction) => Promise<T | null>,
    updateById: (id: string, input: Partial<T>, tx?: DBTransaction) => Promise<T>,
    tx?: DBTransaction
  ): Promise<T[]> {
    if (inputs.length === 0) return [];

    try {
      return await upsertMany(inputs, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;

      const results: T[] = [];
      for (const input of inputs) {
        const existing = await getBySlug(input.slug, tx);
        if (existing && "id" in existing) {
          results.push(await updateById(existing.id as string, input, tx));
        }
      }
      return results;
    }
  }

  export async function upsertManyMobileWallets(
    inputs: readonly SupportedMobileWalletInsertType[],
    tx?: DBTransaction
  ) {
    return upsertWithDuplicateFallback(
      inputs,
      SupportedMobileWalletRepository.upsertMany,
      SupportedMobileWalletRepository.getBySlug,
      (id, input, transaction) => SupportedMobileWalletRepository.update(id, input, transaction),
      tx
    );
  }

  export async function upsertManyPaymentLinks(inputs: readonly SupportedPaymentLinkInsertType[], tx?: DBTransaction) {
    return upsertWithDuplicateFallback(
      inputs,
      SupportedPaymentLinkRepository.upsertMany,
      SupportedPaymentLinkRepository.getBySlug,
      (id, input, transaction) => SupportedPaymentLinkRepository.update(id, input, transaction),
      tx
    );
  }

  export async function getMobileWalletBySlug(slug: string, tx?: DBTransaction) {
    return SupportedMobileWalletRepository.getBySlug(slug, tx);
  }

  export async function getPaymentLinkBySlug(slug: string, tx?: DBTransaction) {
    return SupportedPaymentLinkRepository.getBySlug(slug, tx);
  }

  export async function upsertManyOnlineAccounts(
    inputs: readonly SupportedOnlineAccountInsertType[],
    tx?: DBTransaction
  ) {
    return upsertWithDuplicateFallback(
      inputs,
      SupportedOnlineAccountRepository.upsertMany,
      SupportedOnlineAccountRepository.getBySlug,
      (id, input, transaction) => SupportedOnlineAccountRepository.update(id, input, transaction),
      tx
    );
  }
}
