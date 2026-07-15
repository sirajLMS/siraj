import { CurrencyHedgeRepository } from "@/backend/db/repo/billing/currency-hedge.repository";
import { AppPermission, type CurrencyCode } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { CurrencyHedgeReturnType, CurrencyHedgeSubmitInput, CurrencyHedgeUpdateInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

const VALID_HEDGE_TYPES = ["LONG", "SHORT"] as const;

export namespace CurrencyHedgeService {
  async function assertManagePermission(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.BILLING_MANAGE_CURRENCY_HEDGES
    );
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  async function assertValidHedgeType(hedgeType: string, tErrors: ErrorsLabels): Promise<void> {
    if (!VALID_HEDGE_TYPES.includes(hedgeType as (typeof VALID_HEDGE_TYPES)[number])) {
      throw new Error(tErrors.invalidInput);
    }
  }

  export async function listHedges(
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<readonly CurrencyHedgeReturnType[]> {
    await assertManagePermission(actorUserId, tErrors);
    return CurrencyHedgeRepository.listAll();
  }

  export async function createHedge(
    actorUserId: string,
    input: CurrencyHedgeSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<CurrencyHedgeReturnType> {
    await assertManagePermission(actorUserId, tErrors);
    await assertValidHedgeType(input.hedgeType, tErrors);
    const now = new Date();
    return CurrencyHedgeRepository.create({ ...input, createdAt: now, updatedAt: now });
  }

  export async function updateHedge(
    actorUserId: string,
    id: string,
    input: CurrencyHedgeUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<CurrencyHedgeReturnType> {
    await assertManagePermission(actorUserId, tErrors);
    if (input.hedgeType) {
      await assertValidHedgeType(input.hedgeType, tErrors);
    }
    return CurrencyHedgeRepository.update(id, input, tErrors);
  }

  export async function deleteHedge(actorUserId: string, id: string, tErrors: ErrorsLabels): Promise<boolean> {
    await assertManagePermission(actorUserId, tErrors);
    return CurrencyHedgeRepository.deleteById(id, tErrors);
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
