import type { DBTransaction } from "@/backend/db/db.types";
import {
  SupportedMobileWalletRepository,
  SupportedOnlineAccountRepository,
  SupportedPaymentLinkRepository,
} from "@/backend/db/repo";
import type { CountryCode } from "@/backend/enum";
import { AppPermission } from "@/backend/enum";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
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

interface CatalogListOps<TListAllItem, TListActiveFilters> {
  listAll: (tx?: DBTransaction) => Promise<TListAllItem[]>;
  listActive: (filters: TListActiveFilters, tx?: DBTransaction) => Promise<TListAllItem[]>;
}

async function listCatalogEntries<TListAllItem, TListActiveFilters extends Record<string, unknown>>(
  actorUserId: string,
  filters: { activeOnly?: boolean } & TListActiveFilters,
  ops: CatalogListOps<TListAllItem, TListActiveFilters>,
  locale?: string
): Promise<TListAllItem[]> {
  if (filters.activeOnly === false) {
    await assertCatalogAdmin(actorUserId, locale);
    return ops.listAll(undefined);
  }
  const { activeOnly: _activeOnly, ...activeFilters } = filters;
  return ops.listActive(activeFilters as TListActiveFilters, undefined);
}

interface CatalogCreateOp<TItem, TCreateInput> {
  create: (input: TCreateInput, tx?: DBTransaction) => Promise<TItem>;
}

async function createCatalogEntry<TItem, TCreateInput>(
  actorUserId: string,
  input: TCreateInput,
  ops: CatalogCreateOp<TItem, TCreateInput>,
  locale?: string
): Promise<TItem> {
  await assertCatalogAdmin(actorUserId, locale);
  return ops.create(input, undefined);
}

interface CatalogUpdateOp<TItem, TUpdateInput> {
  update: (id: string, input: TUpdateInput, tx?: DBTransaction, locale?: string) => Promise<TItem>;
}

async function updateCatalogEntry<TItem, TUpdateInput>(
  actorUserId: string,
  id: string,
  input: TUpdateInput,
  ops: CatalogUpdateOp<TItem, TUpdateInput>,
  locale?: string
): Promise<TItem> {
  await assertCatalogAdmin(actorUserId, locale);
  return ops.update(id, input, undefined, locale);
}

interface CatalogDeactivateOp<TItem> {
  deactivate: (id: string, tx?: DBTransaction, locale?: string) => Promise<TItem>;
}

async function deactivateCatalogEntry<TItem>(
  actorUserId: string,
  id: string,
  ops: CatalogDeactivateOp<TItem>,
  locale?: string
): Promise<TItem> {
  await assertCatalogAdmin(actorUserId, locale);
  return ops.deactivate(id, undefined, locale);
}

export namespace PaymentCatalogService {
  export async function listMobileWallets(
    actorUserId: string,
    filters?: { countryCode?: CountryCode; direction?: PaymentDirection; activeOnly?: boolean },
    locale?: string
  ) {
    return listCatalogEntries(
      actorUserId,
      filters ?? {},
      {
        listAll: SupportedMobileWalletRepository.listAll,
        listActive: SupportedMobileWalletRepository.listActive,
      },
      locale
    );
  }

  export async function createMobileWallet(
    actorUserId: string,
    input: SupportedMobileWalletSubmitInput,
    locale?: string
  ) {
    return createCatalogEntry(actorUserId, input, { create: SupportedMobileWalletRepository.create }, locale);
  }

  export async function updateMobileWallet(
    actorUserId: string,
    id: string,
    input: UpdateSupportedMobileWalletInput,
    locale?: string
  ) {
    return updateCatalogEntry(actorUserId, id, input, { update: SupportedMobileWalletRepository.update }, locale);
  }

  export async function deactivateMobileWallet(actorUserId: string, id: string, locale?: string) {
    return deactivateCatalogEntry(actorUserId, id, { deactivate: SupportedMobileWalletRepository.deactivate }, locale);
  }

  export async function listPaymentLinks(
    actorUserId: string,
    filters?: { direction?: PaymentDirection; activeOnly?: boolean },
    locale?: string
  ) {
    return listCatalogEntries(
      actorUserId,
      filters ?? {},
      {
        listAll: SupportedPaymentLinkRepository.listAll,
        listActive: SupportedPaymentLinkRepository.listActive,
      },
      locale
    );
  }

  export async function createPaymentLink(
    actorUserId: string,
    input: SupportedPaymentLinkSubmitInput,
    locale?: string
  ) {
    return createCatalogEntry(actorUserId, input, { create: SupportedPaymentLinkRepository.create }, locale);
  }

  export async function updatePaymentLink(
    actorUserId: string,
    id: string,
    input: UpdateSupportedPaymentLinkInput,
    locale?: string
  ) {
    return updateCatalogEntry(actorUserId, id, input, { update: SupportedPaymentLinkRepository.update }, locale);
  }

  export async function deactivatePaymentLink(actorUserId: string, id: string, locale?: string) {
    return deactivateCatalogEntry(actorUserId, id, { deactivate: SupportedPaymentLinkRepository.deactivate }, locale);
  }

  export async function listOnlineAccounts(
    actorUserId: string,
    filters?: { direction?: PaymentDirection; activeOnly?: boolean },
    locale?: string
  ) {
    return listCatalogEntries(
      actorUserId,
      filters ?? {},
      {
        listAll: SupportedOnlineAccountRepository.listAll,
        listActive: SupportedOnlineAccountRepository.listActive,
      },
      locale
    );
  }

  export async function createOnlineAccount(
    actorUserId: string,
    input: SupportedOnlineAccountSubmitInput,
    locale?: string
  ) {
    return createCatalogEntry(actorUserId, input, { create: SupportedOnlineAccountRepository.create }, locale);
  }

  export async function updateOnlineAccount(
    actorUserId: string,
    id: string,
    input: UpdateSupportedOnlineAccountInput,
    locale?: string
  ) {
    return updateCatalogEntry(actorUserId, id, input, { update: SupportedOnlineAccountRepository.update }, locale);
  }

  export async function deactivateOnlineAccount(actorUserId: string, id: string, locale?: string) {
    return deactivateCatalogEntry(actorUserId, id, { deactivate: SupportedOnlineAccountRepository.deactivate }, locale);
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
