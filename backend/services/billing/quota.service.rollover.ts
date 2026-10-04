import { and, eq, isNull } from "drizzle-orm";
import { withForUpdate } from "@/backend/db";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { quotas } from "@/backend/db/schema";
import { mapQuotaToReturnType } from "@/backend/lib";
import { QuotaNotFoundError, ValidationError } from "@/backend/lib/errors";
import type { DBTransaction, QuotaReturnType, QuotaSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Locks the quota row for refresh (SELECT … FOR UPDATE).
 */
async function lockQuotaForRefresh(tx: DBTransaction, quotaId: string): Promise<QuotaSelectType | null> {
  const query = tx
    .select()
    .from(quotas)
    .where(and(eq(quotas.id, quotaId), isNull(quotas.deletedAt)));
  const [row] = await withForUpdate(query).limit(1);
  return row ?? null;
}

/** Computes the period-end date from an anchor + periodDays. */
function computePeriodEnd(anchor: Date, periodDays: number): Date {
  return new Date(anchor.getTime() + periodDays * 24 * 60 * 60 * 1000);
}

/**
 * Type guard for the rich JSONB rollover policy shape enforced by
 * `quotas_rollover_policy_valid_chk` (`maxRolloverPercent` +
 * `accumulationCap`). Returns `false` for legacy plain-string policies
 * (`"GRANT" | "EXPIRE"`).
 */
function isRichRolloverPolicy(
  policy: unknown
): policy is { maxRolloverPercent: number | null; accumulationCap: number | null } {
  if (typeof policy === "object" && policy !== null) {
    return "maxRolloverPercent" in policy && "accumulationCap" in policy;
  }
  return false;
}

/**
 * Computes how many of `unused` classes carry over to the new period,
 * honoring both the rich JSONB rollover policy and the legacy
 * plain-string `"GRANT" | "EXPIRE"` policy.
 */
function computeRolloverAmount(rolloverPolicy: QuotaSelectType["rolloverPolicy"], unused: number): number {
  if (isRichRolloverPolicy(rolloverPolicy)) {
    const percent = rolloverPolicy.maxRolloverPercent ?? 100;
    const raw = Math.floor(unused * (percent / 100));
    const cap = rolloverPolicy.accumulationCap;
    return Math.min(raw, cap ?? raw);
  }
  if (typeof rolloverPolicy === "string") {
    if (rolloverPolicy === "GRANT") {
      return unused;
    }
    return 0;
  }
  return unused;
}

/** Advances an anchor forward in whole `periodDays` increments until it sits after `now`. */
function advancePeriodAnchor(anchor: Date, periodDays: number, now: Date): Date {
  let next = anchor;
  while (next <= now) {
    next = new Date(next.getTime() + periodDays * 24 * 60 * 60 * 1000);
  }
  return next;
}

/**
 * Refresh a single PERIODIC quota for its next period.
 *
 * All business rules — validation (kind must be PERIODIC, periodDays > 0),
 * period expiry check, rollover computation (policy-based), and period
 * anchor advancement — live here in the service layer.  The repository's
 * `applyRefreshPeriodic` performs only the version-checked UPDATE and
 * ledger INSERTs.
 *
 * The `rolloverPolicy` column on `quotas` is a JSONB object of shape
 * `{ maxRolloverPercent: number | null; accumulationCap: number | null }`
 * (enforced by `quotas_rollover_policy_valid_chk`). When present, the
 * rollover amount is computed as:
 *
 *   rollover = min(floor(remaining * maxRolloverPercent / 100),
 *                  accumulationCap)
 *
 * For backward compatibility with legacy quotas whose `rolloverPolicy` is a
 * plain `"GRANT" | "EXPIRE"` string, that policy is honored too:
 *   - "GRANT":  all unused preserved, full replenish
 *   - "EXPIRE": all unused expired, full replenish
 *
 * Idempotent: EXPIRE/GRANT keys are scoped to the ending period, and the
 * method no-ops (returns the unchanged row) when the period has not ended.
 */
export async function refreshPeriodicFlow(
  tx: DBTransaction,
  quotaId: string,
  actorUserId: string | null | undefined,
  locale: string
): Promise<QuotaReturnType> {
  // --- Lock the quota row (data access) ---
  const tErrors = getServerTranslations(locale).errorsTranslations;
  const target = await lockQuotaForRefresh(tx, quotaId);
  if (!target) throw new QuotaNotFoundError(tErrors.quotaNotFound);

  // --- Business rules: validation ---
  if (target.kind !== "PERIODIC") {
    throw new ValidationError(tErrors.quota.cannotRefreshNonPeriodic);
  }
  if (!target.periodDays || target.periodDays <= 0) {
    throw new ValidationError(tErrors.quota.noValidPeriodDays);
  }

  // --- Business rules: period expiry check ---
  const now = new Date();
  const periodAnchor = target.periodAnchor ?? target.createdAt;
  const periodEnd = computePeriodEnd(periodAnchor, target.periodDays);
  if (now <= periodEnd) {
    return mapQuotaToReturnType(target);
  }

  // --- Business rules: rollover computation ---
  const periodStr = periodEnd.toISOString().slice(0, 10);
  const unused = Math.max(target.remaining, 0);
  const rolloverAmount = computeRolloverAmount(target.rolloverPolicy, unused);
  const newRemaining = rolloverAmount + target.totalClasses;
  const expiredAmount = unused - rolloverAmount;
  const newAnchor = advancePeriodAnchor(periodEnd, target.periodDays, now);

  // --- Data access: apply the pre-computed refresh ---
  return QuotaRepository.applyRefreshPeriodic(tx, target, {
    newRemaining,
    newAnchor,
    expiredAmount,
    periodStr,
    actorUserId: actorUserId ?? null,
  });
}
