import { db } from "@/backend/db/drizzleDb";
import { PackagePlanRepository } from "@/backend/db/repo/billing";
import { AppPermission } from "@/backend/enum";
import { ConflictError, logger, NotFoundError, ValidationError } from "@/backend/lib";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import type {
  PaginationArgs,
  PackagePlanReturnType,
  PackagePlanSubmitInput,
  PackagePlanUpdateInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * PackagePlanService — catalog CRUD for predefined credit-hour packages.
 * A package plan is a CONFIG entry: purchases snapshot hours/price/currency
 * onto the payment row, so later edits never retroactively change payments.
 */
export namespace PackagePlanService {
  const validateSubmitInput = (input: PackagePlanSubmitInput, tErrors: ErrorsLabels): void => {
    if (!input.codename || input.codename.trim().length === 0) throw new ValidationError(tErrors.package.invalidInput);
    if (!input.displayName || input.displayName.trim().length === 0)
      throw new ValidationError(tErrors.package.invalidInput);
    if (!Number.isFinite(input.creditHours) || input.creditHours <= 0)
      throw new ValidationError(tErrors.package.invalidInput);
    if (!Number.isFinite(input.priceAmount) || input.priceAmount <= 0)
      throw new ValidationError(tErrors.package.invalidInput);
    if (!input.currency) throw new ValidationError(tErrors.package.invalidInput);
  };

  export async function create(
    actorUserId: string,
    input: PackagePlanSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<PackagePlanReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);
    validateSubmitInput(input, tErrors);

    // Case-insensitive uniqueness (DB partial-unique is case-sensitive; this
    // service-side check is the safety net per EC-10).
    const duplicate = await PackagePlanRepository.findByCodename(input.codename.trim());
    if (duplicate && duplicate.deletedAt === null) {
      throw new ConflictError(tErrors.package.codenameAlreadyExists(input.codename.trim()));
    }

    const created = await db.transaction(async tx =>
      PackagePlanRepository.create(tx, {
        codename: input.codename.trim().toUpperCase(),
        displayName: input.displayName,
        description: input.description ?? null,
        creditHours: String(input.creditHours),
        priceAmount: String(input.priceAmount),
        currency: input.currency,
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? 0,
        metadata: input.metadata ?? null,
      })
    );

    logger.info("Package plan created", {
      actorUserId,
      planId: created.id,
      codename: created.codename,
      creditHours: created.creditHours,
      priceAmount: created.priceAmount,
      currency: created.currency,
    });

    return created;
  }

  export async function update(
    actorUserId: string,
    input: PackagePlanUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<PackagePlanReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    const existing = await PackagePlanRepository.findById(input.id);
    if (!existing || existing.deletedAt !== null) {
      // v1 reuses the planArchived label for missing-or-archived lookups.
      throw new NotFoundError("PACKAGE_PLAN", tErrors.package.planArchived(input.id));
    }

    const patch = {
      displayName: input.displayName,
      description: input.description,
      creditHours: input.creditHours !== undefined ? String(input.creditHours) : undefined,
      priceAmount: input.priceAmount !== undefined ? String(input.priceAmount) : undefined,
      currency: input.currency,
      active: input.active,
      sortOrder: input.sortOrder,
      metadata: input.metadata,
    };

    const updated = await db.transaction(async tx =>
      PackagePlanRepository.update(tx, input.id, patch, input.version)
    );
    if (!updated) {
      throw new NotFoundError("PACKAGE_PLAN", tErrors.package.planArchived(input.id));
    }

    logger.info("Package plan updated", { actorUserId, planId: updated.id });
    return updated;
  }

  /** Soft-archive: past payments keep their FK + snapshot; catalog hides it. */
  export async function archive(actorUserId: string, id: string, tErrors: ErrorsLabels): Promise<void> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    const existing = await PackagePlanRepository.findById(id);
    if (!existing || existing.deletedAt !== null) {
      throw new NotFoundError("PACKAGE_PLAN", tErrors.package.planArchived(id));
    }

    await db.transaction(async tx => {
      await PackagePlanRepository.archive(tx, id);
    });

    logger.info("Package plan archived", { actorUserId, planId: id, codename: existing.codename });
  }

  export async function getById(planId: string): Promise<PackagePlanReturnType | null> {
    return PackagePlanRepository.findById(planId);
  }

  /** Active-only list for the Add Payment auto-fill dropdown (post-login caller). */
  export async function listActive(): Promise<PackagePlanReturnType[]> {
    return PackagePlanRepository.listActive();
  }

  export async function listPaginated(
    paginationArgs: PaginationArgs | null
  ): Promise<PackagePlanReturnType[]> {
    return PackagePlanRepository.listAllPaginated(paginationArgs);
  }
}
