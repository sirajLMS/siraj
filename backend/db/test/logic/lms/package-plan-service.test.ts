import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { packagePlans, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { PackagePlanService } from "@/backend/services/billing/package-plan.service";
import type { PackagePlanSubmitInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

async function catchError(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    return error instanceof Error ? error : new Error("Unexpected rejection shape");
  }
  throw new Error("expected the wrapped service call to throw");
}

/**
 * PackagePlanService enforces permissions against committed rows and opens its
 * own transactions, so fixtures here are COMMITTED and hard-deleted in
 * `afterAll` (mirrors the accounting-payment-workflow convention).
 */
describe("PackagePlanService", () => {
  const UNIQUE = `ppsvc_${randomUUID().slice(0, 8)}`;

  let tErrors: ErrorsLabels;
  let adminUserId = "";
  let unrelatedUserId = "";
  const createdPlanIds: string[] = [];

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    await db.transaction(async tx => {
      const admin = await createTestUser(tx, { isSuperAdmin: true });
      const unrelated = await createTestUser(tx);
      adminUserId = admin.id;
      unrelatedUserId = unrelated.id;
    });
  });

  afterAll(async () => {
    if (!adminUserId) return;
    await db.transaction(async tx => {
      if (createdPlanIds.length > 0) {
        await tx.delete(packagePlans).where(inArray(packagePlans.id, createdPlanIds));
      }
      await tx.delete(users).where(inArray(users.id, [adminUserId, unrelatedUserId].filter(Boolean)));
    });
  });

  function submitInput(overrides: Partial<PackagePlanSubmitInput> = {}): PackagePlanSubmitInput {
    return {
      codename: `${UNIQUE}_${randomUUID().slice(0, 4)}`,
      displayName: "Service Fixture Plan",
      description: "via service",
      creditHours: 10,
      priceAmount: 300,
      currency: CurrencyCode.USD,
      active: true,
      sortOrder: 2,
      metadata: { source: UNIQUE },
      ...overrides,
    };
  }

  test("create persists a normalized plan (trimmed, uppercased codename) for a privileged actor", async () => {
    const created = await PackagePlanService.create(
      adminUserId,
      submitInput({ codename: `  ${UNIQUE}_mixedCase ` }),
      tErrors
    );
    createdPlanIds.push(created.id);

    expect(created.codename).toBe(`${UNIQUE}_MIXEDCASE`.toUpperCase());
    expect(created.active).toBe(true);
    expect(created.description).toBe("via service");
    expect(Number(created.creditHours)).toBe(10);
    expect(created.metadata).toEqual({ source: UNIQUE });
  });

  test("create rejects every invalid-input branch with the localized package error", async () => {
    const invalidInputs: PackagePlanSubmitInput[] = [
      // Empty / blank codename.
      submitInput({ codename: "" }),
      submitInput({ codename: "   " }),
      // Blank display name.
      submitInput({ displayName: "" }),
      // Non-positive / non-finite hours and price.
      submitInput({ creditHours: 0 }),
      submitInput({ creditHours: Number.NaN }),
      submitInput({ priceAmount: -5 }),
    ];

    const errors = await Promise.all(
      invalidInputs.map(input => catchError(() => PackagePlanService.create(adminUserId, input, tErrors)))
    );
    for (const error of errors) {
      expect(error.message).toBe(tErrors.package.invalidInput);
    }
  });

  test("create rejects a live duplicate codename case-insensitively", async () => {
    const first = await PackagePlanService.create(adminUserId, submitInput({ codename: `${UNIQUE}_dup` }), tErrors);
    createdPlanIds.push(first.id);

    const error = await catchError(() =>
      PackagePlanService.create(adminUserId, submitInput({ codename: `${UNIQUE}_DUP` }), tErrors)
    );
    expect(error.message).toBe(tErrors.package.codenameAlreadyExists(`${UNIQUE}_DUP`));
  });

  test("create / update / archive are denied for actors without ACCOUNTING_PAYMENTS_MANAGE", async () => {
    const forbidden = tErrors.insufficientPermissions;

    const [createError, updateError, archiveError] = await Promise.all([
      catchError(() => PackagePlanService.create(unrelatedUserId, submitInput(), tErrors)),
      // Unknown id is fine — the denial fires before the lookup.
      catchError(() => PackagePlanService.update(unrelatedUserId, { id: randomUUID() }, tErrors)),
      catchError(() => PackagePlanService.archive(unrelatedUserId, randomUUID(), tErrors)),
    ]);
    expect(createError.message).toBe(forbidden);
    expect(updateError.message).toBe(forbidden);
    expect(archiveError.message).toBe(forbidden);
  });

  test("update edits the row (with matching version) and rejects unknown or archived plans", async () => {
    const created = await PackagePlanService.create(adminUserId, submitInput({ codename: `${UNIQUE}_edit` }), tErrors);
    createdPlanIds.push(created.id);

    const updated = await PackagePlanService.update(
      adminUserId,
      {
        id: created.id,
        displayName: "Renamed Plan",
        creditHours: 25,
        priceAmount: 750,
        currency: CurrencyCode.EUR,
        active: false,
        sortOrder: 9,
        version: created.version,
      },
      tErrors
    );
    expect(updated.displayName).toBe("Renamed Plan");
    expect(Number(updated.creditHours)).toBe(25);
    expect(updated.currency).toBe(CurrencyCode.EUR);

    const missingId = randomUUID();
    const missing = await catchError(() => PackagePlanService.update(adminUserId, { id: missingId }, tErrors));
    expect(missing.message).toBe(tErrors.package.planArchived(missingId));

    await PackagePlanService.archive(adminUserId, created.id, tErrors);
    const archivedEdit = await catchError(() =>
      PackagePlanService.update(adminUserId, { id: created.id, displayName: "nope" }, tErrors)
    );
    expect(archivedEdit.message).toBe(tErrors.package.planArchived(created.id));
  });

  test("archive is rejected when the plan is missing or already archived", async () => {
    const missingId = randomUUID();
    const missing = await catchError(() => PackagePlanService.archive(adminUserId, missingId, tErrors));
    expect(missing.message).toBe(tErrors.package.planArchived(missingId));

    const created = await PackagePlanService.create(adminUserId, submitInput({ codename: `${UNIQUE}_twice` }), tErrors);
    createdPlanIds.push(created.id);
    await PackagePlanService.archive(adminUserId, created.id, tErrors);

    const second = await catchError(() => PackagePlanService.archive(adminUserId, created.id, tErrors));
    expect(second.message).toBe(tErrors.package.planArchived(created.id));
  });

  test("getById returns the plan or null", async () => {
    const created = await PackagePlanService.create(adminUserId, submitInput({ codename: `${UNIQUE}_get` }), tErrors);
    createdPlanIds.push(created.id);

    const found = await PackagePlanService.getById(created.id);
    expect(found?.id).toBe(created.id);
    expect(await PackagePlanService.getById(randomUUID())).toBeNull();
  });

  test("ensureManyByCodename creates missing plans and returns existing ones idempotently", async () => {
    const inputs = [
      submitInput({ codename: `${UNIQUE}_ensure_a` }),
      submitInput({ codename: `${UNIQUE}_ensure_b`, displayName: "Second ensured" }),
      // In-batch duplicate resolves to the row created one step earlier.
      submitInput({ codename: `${UNIQUE}_ensure_a` }),
    ];

    const ensured = await PackagePlanService.ensureManyByCodename(inputs);
    for (const row of ensured) createdPlanIds.push(row.id);

    expect(ensured).toHaveLength(3);
    expect(ensured[0]?.codename).toBe(`${UNIQUE}_ENSURE_A`.toUpperCase());
    expect(ensured[2]?.id).toBe(ensured[0]?.id);

    const secondRun = await PackagePlanService.ensureManyByCodename([submitInput({ codename: `${UNIQUE}_ensure_a` })]);
    expect(secondRun[0]?.id).toBe(ensured[0]?.id);
  });

  test("listActive omits archived plans while listPaginated still exposes them", async () => {
    const target = await PackagePlanService.create(
      adminUserId,
      submitInput({ codename: `${UNIQUE}_visib`, displayName: "Visibility Probe" }),
      tErrors
    );
    createdPlanIds.push(target.id);
    await PackagePlanService.archive(adminUserId, target.id, tErrors);

    const active = await PackagePlanService.listActive();
    expect(active.some(row => row.id === target.id)).toBe(false);

    const all = await PackagePlanService.listPaginated(null);
    expect(all.some(row => row.id === target.id)).toBe(true);
  });
});
