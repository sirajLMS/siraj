import {
  SupportedMobileWalletRepository,
  SupportedOnlineAccountRepository,
  SupportedPaymentLinkRepository,
} from "@/backend/db/repo/billing";
import type { CountryCode } from "@/backend/enum";
import { AppPermission } from "@/backend/enum";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  DBTransaction,
  SupportedMobileWalletInsertType,
  SupportedMobileWalletSubmitInput,
  SupportedOnlineAccountInsertType,
  SupportedOnlineAccountSubmitInput,
  SupportedPaymentLinkInsertType,
  SupportedPaymentLinkSubmitInput,
  UpdateSupportedMobileWalletInput,
  UpdateSupportedOnlineAccountInput,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

async function assertCatalogAdmin(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.PAYMENT_METHODS_MANAGE_CATALOGS
  );
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

type CatalogRepo<
  TResult,
  TCreateInput,
  TUpdateInput,
  TListActiveFilter extends { direction?: PaymentDirection } = { direction?: PaymentDirection },
> = {
  listAll: (tx?: DBTransaction) => Promise<TResult[]>;
  listActive: (filters?: TListActiveFilter, tx?: DBTransaction) => Promise<TResult[]>;
  create: (input: TCreateInput, tx?: DBTransaction) => Promise<TResult>;
  update: (id: string, input: TUpdateInput, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<TResult>;
  deactivate: (id: string, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<TResult>;
};

type CatalogListFilters<TListActiveFilter> = {
  readonly activeOnly?: boolean;
} & TListActiveFilter;

function buildCatalogMethods<
  TResult,
  TCreateInput,
  TUpdateInput,
  TListActiveFilter extends { direction?: PaymentDirection },
>(repo: CatalogRepo<TResult, TCreateInput, TUpdateInput, TListActiveFilter>) {
  return {
    async list(actorUserId: string, tErrors: ErrorsLabels, filters: CatalogListFilters<TListActiveFilter> | undefined) {
      await assertCatalogAdmin(actorUserId, tErrors);
      if (filters?.activeOnly === false) {
        return repo.listAll(undefined);
      }
      return repo.listActive(filters, undefined);
    },
    async create(actorUserId: string, input: TCreateInput, tErrors: ErrorsLabels) {
      await assertCatalogAdmin(actorUserId, tErrors);
      return repo.create(input, undefined);
    },
    async update(actorUserId: string, id: string, input: TUpdateInput, tErrors: ErrorsLabels) {
      await assertCatalogAdmin(actorUserId, tErrors);
      return repo.update(id, input, tErrors);
    },
    async deactivate(actorUserId: string, id: string, tErrors: ErrorsLabels) {
      await assertCatalogAdmin(actorUserId, tErrors);
      return repo.deactivate(id, tErrors);
    },
  };
}

const mobileWalletCatalog = buildCatalogMethods(SupportedMobileWalletRepository);
const paymentLinkCatalog = buildCatalogMethods(SupportedPaymentLinkRepository);
const onlineAccountCatalog = buildCatalogMethods(SupportedOnlineAccountRepository);

export namespace PaymentCatalogService {
  // ─── Mobile Wallets ──────────────────────────────────────────────────────
  export async function listMobileWallets(
    actorUserId: string,
    tErrors: ErrorsLabels,
    filters?: { countryCode?: CountryCode; direction?: PaymentDirection; activeOnly?: boolean }
  ) {
    await assertCatalogAdmin(actorUserId, tErrors);
    if (filters?.activeOnly === false) {
      return SupportedMobileWalletRepository.listAll();
    }
    return SupportedMobileWalletRepository.listActive({
      countryCode: filters?.countryCode,
      direction: filters?.direction,
    });
  }

  export async function createMobileWallet(
    actorUserId: string,
    input: SupportedMobileWalletSubmitInput,
    tErrors: ErrorsLabels
  ) {
    return mobileWalletCatalog.create(actorUserId, input, tErrors);
  }

  export async function updateMobileWallet(
    actorUserId: string,
    id: string,
    input: UpdateSupportedMobileWalletInput,
    tErrors: ErrorsLabels
  ) {
    return mobileWalletCatalog.update(actorUserId, id, input, tErrors);
  }

  export async function deactivateMobileWallet(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    return mobileWalletCatalog.deactivate(actorUserId, id, tErrors);
  }

  // ─── Payment Links ───────────────────────────────────────────────────────
  export async function listPaymentLinks(
    actorUserId: string,
    tErrors: ErrorsLabels,
    filters?: { direction?: PaymentDirection; activeOnly?: boolean }
  ) {
    return paymentLinkCatalog.list(actorUserId, tErrors, filters);
  }

  export async function createPaymentLink(
    actorUserId: string,
    input: SupportedPaymentLinkSubmitInput,
    tErrors: ErrorsLabels
  ) {
    return paymentLinkCatalog.create(actorUserId, input, tErrors);
  }

  export async function updatePaymentLink(
    actorUserId: string,
    id: string,
    input: UpdateSupportedPaymentLinkInput,
    tErrors: ErrorsLabels
  ) {
    return paymentLinkCatalog.update(actorUserId, id, input, tErrors);
  }

  export async function deactivatePaymentLink(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    return paymentLinkCatalog.deactivate(actorUserId, id, tErrors);
  }

  // ─── Online Accounts ─────────────────────────────────────────────────────
  export async function listOnlineAccounts(
    actorUserId: string,
    tErrors: ErrorsLabels,
    filters?: { direction?: PaymentDirection; activeOnly?: boolean }
  ) {
    return onlineAccountCatalog.list(actorUserId, tErrors, filters);
  }

  export async function createOnlineAccount(
    actorUserId: string,
    input: SupportedOnlineAccountSubmitInput,
    tErrors: ErrorsLabels
  ) {
    return onlineAccountCatalog.create(actorUserId, input, tErrors);
  }

  export async function updateOnlineAccount(
    actorUserId: string,
    id: string,
    input: UpdateSupportedOnlineAccountInput,
    tErrors: ErrorsLabels
  ) {
    return onlineAccountCatalog.update(actorUserId, id, input, tErrors);
  }

  export async function deactivateOnlineAccount(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    return onlineAccountCatalog.deactivate(actorUserId, id, tErrors);
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
    updateById: (id: string, input: Partial<T>, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<T>,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<T[]> {
    if (inputs.length === 0) return [];

    try {
      return await upsertMany(inputs, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;

      const results = await inputs.reduce(
        async (accPromise, input) => {
          const acc = await accPromise;
          const existing = await getBySlug(input.slug, tx);
          if (existing && "id" in existing && typeof existing.id === "string") {
            acc.push(await updateById(existing.id, input, tErrors, tx));
          }
          return acc;
        },
        Promise.resolve([] as T[])
      );
      return results;
    }
  }

  export async function upsertManyMobileWallets(
    inputs: readonly SupportedMobileWalletInsertType[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ) {
    return upsertWithDuplicateFallback(
      inputs,
      SupportedMobileWalletRepository.upsertMany,
      SupportedMobileWalletRepository.getBySlug,
      (id, input, errorLabels, transaction) =>
        SupportedMobileWalletRepository.update(id, input, errorLabels, transaction),
      tErrors,
      tx
    );
  }

  export async function upsertManyPaymentLinks(
    inputs: readonly SupportedPaymentLinkInsertType[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ) {
    return upsertWithDuplicateFallback(
      inputs,
      SupportedPaymentLinkRepository.upsertMany,
      SupportedPaymentLinkRepository.getBySlug,
      (id, input, errorLabels, transaction) =>
        SupportedPaymentLinkRepository.update(id, input, errorLabels, transaction),
      tErrors,
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
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ) {
    return upsertWithDuplicateFallback(
      inputs,
      SupportedOnlineAccountRepository.upsertMany,
      SupportedOnlineAccountRepository.getBySlug,
      (id, input, errorLabels, transaction) =>
        SupportedOnlineAccountRepository.update(id, input, errorLabels, transaction),
      tErrors,
      tx
    );
  }
}
