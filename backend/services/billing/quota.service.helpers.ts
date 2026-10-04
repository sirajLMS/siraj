import { db } from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { mapQuotaToReturnType } from "@/backend/lib";
import { UnauthorizedError } from "@/backend/lib/errors";
import {
  assertAssociatedOrManage,
  requirePermission as sharedRequirePermission,
} from "@/backend/services/billing/permission-utils";
import type { DBTransaction, QuotaReturnType, ReadExecutor } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Thin wrapper around the shared `requirePermission` from
 * `permission-utils.ts`. Resolves `tErrors` from the locale and
 * delegates to the shared helper to avoid duplicating the permission
 * check logic across services.
 */
export async function requirePermission(
  actorUserId: string | null | undefined,
  locale: string,
  permission: AppPermission
): Promise<void> {
  if (!actorUserId) {
    const tErrors = getServerTranslations(locale).errorsTranslations;
    throw new UnauthorizedError(tErrors.unauthorizedAction);
  }
  const tErrors = getServerTranslations(locale).errorsTranslations;
  await sharedRequirePermission(actorUserId, permission, tErrors);
}

/**
 * Shared transaction executor: runs `runner` against `tx` when provided,
 * otherwise against a fresh `db.transaction`. Eliminates the repeating
 * `return tx ? runner(tx) : db.transaction(runner);` boilerplate across
 * every write method in this service.
 */
export async function runInTx<T>(tx: DBTransaction | undefined, runner: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Shared permission + IDOR-scoping gate for student-scoped list reads.
 * Applies the QUOTAS_VIEW permission check, then verifies the caller is
 * associated with `studentId` (or holds QUOTAS_MANAGE) before delegating
 * to `listFn` and mapping the rows. Used by `listStudentOpenQuotas` and
 * `listStudentQuotas`.
 */
export async function listScopedByStudent<T extends Parameters<typeof mapQuotaToReturnType>[0]>(
  studentId: string,
  tx: ReadExecutor | undefined,
  actorUserId: string | null | undefined,
  locale: string,
  listFn: (tx: ReadExecutor | undefined, studentId: string) => Promise<T[]>
): Promise<QuotaReturnType[]> {
  await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
  const uid = actorUserId ?? "";
  await assertAssociatedOrManage(uid, studentId, getServerTranslations(locale).errorsTranslations);
  const rows = await listFn(tx, studentId);
  return rows.map(row => mapQuotaToReturnType(row));
}

/**
 * Shared QUOTAS_MANAGE write helper: permission gate + transaction + map.
 * Used by the CRUD write methods (`createQuota`, `updateQuota`,
 * `deleteQuota`) to collapse their identical scaffolding into a single
 * call site.
 */
export async function manageAndMap(
  locale: string,
  actorUserId: string | null | undefined,
  tx: DBTransaction | undefined,
  op: (t: DBTransaction) => Promise<Parameters<typeof mapQuotaToReturnType>[0]>
): Promise<QuotaReturnType> {
  await requirePermission(actorUserId, locale, AppPermission.QUOTAS_MANAGE);
  return runInTx(tx, async t => mapQuotaToReturnType(await op(t)));
}

/**
 * Shared transactional idempotent-write helper. Runs an idempotency-keyed
 * ledger mutation (reserve/release/redeem) inside `runInTx` and returns the
 * mapped `QuotaReturnType`. Collapses the repeated
 * derive-key → repo-op → map body shared by the recurring-schedule and
 * per-instance reserve/release methods.
 */
export async function txOp(
  tx: DBTransaction | undefined,
  op: (t: DBTransaction) => Promise<QuotaReturnType>
): Promise<QuotaReturnType> {
  return runInTx(tx, op);
}
