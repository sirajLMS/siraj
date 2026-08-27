import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { PackagePlanRepository } from "@/backend/db/repo/billing";
import { expectSavepointError, runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Shared factory: creates a package plan row inside the current rollback tx.
 * Codenames are prefixed + randomized so tests never collide with pre-existing
 * catalog rows (db/test AGENTS rule 12).
 */
function planInput(codename: string) {
  return {
    codename,
    displayName: `Display ${codename}`,
    creditHours: "20.00",
    priceAmount: "300.00",
    currency: CurrencyCode.USD,
    sortOrder: 3,
  };
}

let sequence = 0;
async function createPlan(tx: Parameters<typeof PackagePlanRepository.create>[0], codenamePrefix: string) {
  sequence += 1;
  return PackagePlanRepository.create(tx, planInput(`${codenamePrefix}_${sequence}_${randomUUID().slice(0, 8)}`));
}

describe("PackagePlanRepository", () => {
  test("create persists defaults and provided fields", async () => {
    await runInRollback(async tx => {
      const created = await createPlan(tx, "pkgrepo_create");

      expect(created.id).toBeDefined();
      expect(created.active).toBe(true);
      expect(created.deletedAt).toBeNull();
      expect(created.sortOrder).toBe(3);
      expect(created.creditHours).toBe("20.00");
      expect(created.priceAmount).toBe("300.00");
      expect(created.currency).toBe(CurrencyCode.USD);
      // Optimistic-lock column starts at its DB default of 0.
      expect(created.version).toBe(0);
    });
  });

  test("findByCodename is case-insensitive", async () => {
    await runInRollback(async tx => {
      const created = await createPlan(tx, "pkgrepo_case");
      const lower = await PackagePlanRepository.findByCodename(created.codename.toLowerCase(), tx);
      const upper = await PackagePlanRepository.findByCodename(created.codename.toUpperCase(), tx);

      expect(lower?.id).toBe(created.id);
      expect(upper?.id).toBe(created.id);
    });
  });

  test("listActive excludes archived (soft-deleted) plans", async () => {
    await runInRollback(async tx => {
      const active = await createPlan(tx, "pkgrepo_active");
      const archived = await createPlan(tx, "pkgrepo_archived");

      await PackagePlanRepository.archive(tx, archived.id);

      const list = await PackagePlanRepository.listActive(tx);
      const ids = list.map(row => row.id);

      expect(ids).toContain(active.id);
      expect(ids).not.toContain(archived.id);

      // Archived rows stay queryable by id for historical payment references.
      const stillThere = await PackagePlanRepository.findById(archived.id, tx);
      expect(stillThere?.active).toBe(false);
      expect(stillThere?.deletedAt).not.toBeNull();
    });
  });

  test("update with stale expectedVersion surfaces a version-mismatch error", async () => {
    await runInRollback(async tx => {
      const created = await createPlan(tx, "pkgrepo_version");

      const updated = await PackagePlanRepository.update(
        tx,
        created.id,
        { displayName: "Renamed once" },
        created.version
      );
      expect(updated?.displayName).toBe("Renamed once");
      expect(updated?.version).toBe(1);

      // Replaying with the ORIGINAL version must be rejected (optimistic lock).
      const error = await expectSavepointError(
        () => PackagePlanRepository.update(tx, created.id, { displayName: "Stale write" }, created.version),
        tx
      );
      expect(error.message).toContain("version mismatch");

      // Omitting expectedVersion skips the guard entirely.
      const unguarded = await PackagePlanRepository.update(tx, created.id, { displayName: "Unguarded rename" });
      expect(unguarded?.displayName).toBe("Unguarded rename");
    });
  });

  test("archive soft-deletes and frees the codename for reuse among live rows", async () => {
    await runInRollback(async tx => {
      const original = await createPlan(tx, "pkgrepo_reuse");
      await PackagePlanRepository.archive(tx, original.id);

      // Partial unique index only spans non-deleted rows → reuse is allowed.
      const reused = await PackagePlanRepository.create(tx, planInput(original.codename));
      expect(reused.codename).toBe(original.codename);
      expect(reused.active).toBe(true);

      // A LIVE duplicate of the same codename must still be rejected.
      const dup = await expectSavepointError(
        () =>
          PackagePlanRepository.create(tx, {
            ...planInput(original.codename),
            displayName: "Second live copy",
          }),
        tx
      );
      expect(dup.message.length).toBeGreaterThan(0);
    });
  });

  test("generateIdempotencyKey is deterministic and case-normalized on codename", async () => {
    const first = PackagePlanRepository.generateIdempotencyKey({
      codename: "Gold_Plan",
      displayName: "Gold Plan",
      creditHours: "20",
      priceAmount: 300,
      currency: "USD",
    });
    const second = PackagePlanRepository.generateIdempotencyKey({
      codename: "gold_plan",
      displayName: "Gold Plan",
      creditHours: 20,
      priceAmount: "300",
      currency: "USD",
    });

    expect(first).toBe(second);
    expect(first.startsWith("pkgplan-")).toBe(true);

    const different = PackagePlanRepository.generateIdempotencyKey({
      codename: "Gold_Plan",
      displayName: "Gold Plan",
      creditHours: "30",
      priceAmount: 300,
      currency: "USD",
    });
    expect(different).not.toBe(first);
  });
});
