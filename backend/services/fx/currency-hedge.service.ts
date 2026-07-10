import { CurrencyHedgeRepository } from "@/backend/db/repo/billing/currency-hedge.repository";
import { AppPermission, type CurrencyCode } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { CurrencyHedgeReturnType, CurrencyHedgeSubmitInput, CurrencyHedgeUpdateInput } from "@/backend/types";

export namespace CurrencyHedgeService {
  async function assertManagePermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_MANAGE_CURRENCY_HEDGES
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }
  }

  export async function listHedges(actorUserId: string, locale?: string): Promise<readonly CurrencyHedgeReturnType[]> {
    await assertManagePermission(actorUserId, locale);
    return CurrencyHedgeRepository.listAll();
  }

  export async function createHedge(
    actorUserId: string,
    input: CurrencyHedgeSubmitInput,
    locale?: string
  ): Promise<CurrencyHedgeReturnType> {
    await assertManagePermission(actorUserId, locale);
    const now = new Date();
    return CurrencyHedgeRepository.create({ ...input, createdAt: now, updatedAt: now });
  }

  export async function updateHedge(
    actorUserId: string,
    id: string,
    input: CurrencyHedgeUpdateInput,
    locale?: string
  ): Promise<CurrencyHedgeReturnType> {
    await assertManagePermission(actorUserId, locale);
    return CurrencyHedgeRepository.update(id, input, undefined, locale);
  }

  export async function deleteHedge(actorUserId: string, id: string, locale?: string): Promise<boolean> {
    await assertManagePermission(actorUserId, locale);
    return CurrencyHedgeRepository.deleteById(id, undefined, locale);
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function findHedgesByCurrencies(
    currencies: readonly CurrencyCode[]
  ): Promise<CurrencyHedgeReturnType[]> {
    return CurrencyHedgeRepository.findByCurrencies(currencies);
  }

  export async function createManyHedges(
    inputs: readonly CurrencyHedgeSubmitInput[]
  ): Promise<CurrencyHedgeReturnType[]> {
    const now = new Date();
    return CurrencyHedgeRepository.createMany(
      inputs.map(input => ({
        ...input,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }
}
