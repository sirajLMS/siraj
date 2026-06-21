import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { BillingRepository } from "@/backend/db/repo/billing.repository";
import { invoices } from "@/backend/db/schema";
import { createTestParent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";

async function createOverdueInvoice(
  tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never,
  parentId: string,
  amount: string,
  dueDateOffsetDays: number,
  status: "UNPAID" | "PAID" | "CANCELLED" = "UNPAID"
) {
  const now = new Date();
  const dueDate = new Date(now.getTime() + dueDateOffsetDays * 86400000);
  const issueDate = new Date(dueDate.getTime() - 30 * 86400000);

  const [invoice] = await tx
    .insert(invoices)
    .values({
      parentId,
      issueDate: issueDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      amount,
      currency: "USD",
      status,
      invoiceType: "MONTHLY",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return invoice;
}

describe("BillingRepository.getUnpaidInvoicesSummary", () => {
  test("returns empty summary when no overdue invoices exist", async () => {
    await runInRollback(async tx => {
      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.id).toBe("unpaid-invoices-summary");
      expect(result.totalOverdueInvoices).toBe(0);
      expect(result.totalOverdueAmount).toBe("0.00");
      expect(result.items).toHaveLength(0);
    });
  });

  test("returns overdue invoices grouped by parent", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Billing Parent",
        email: `billing-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      await createOverdueInvoice(tx, parent.id, "100.00", -10);
      await createOverdueInvoice(tx, parent.id, "50.00", -5);

      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.totalOverdueInvoices).toBe(2);
      expect(result.totalOverdueAmount).toBe("150.00");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].userId).toBe(parentUser.id);
      expect(result.items[0].userName).toBe("Billing Parent");
      expect(result.items[0].totalUnpaidAmount).toBe("150.00");
      expect(result.items[0].overdueCount).toBe(2);
      expect(result.items[0].currency).toBe("USD");
    });
  });

  test("excludes paid and future-due invoices", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, { name: "Mixed Parent", email: `mixed-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, parentUser.id);

      await createOverdueInvoice(tx, parent.id, "100.00", -10, "UNPAID");
      await createOverdueInvoice(tx, parent.id, "200.00", -5, "PAID");
      await createOverdueInvoice(tx, parent.id, "300.00", 10, "UNPAID");

      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.totalOverdueInvoices).toBe(1);
      expect(result.totalOverdueAmount).toBe("100.00");
      expect(result.items).toHaveLength(1);
    });
  });

  test("groups multiple parents separately", async () => {
    await runInRollback(async tx => {
      const user1 = await createTestUser(tx, { name: "Parent One", email: `p1-${randomUUID()}@test.com` });
      const parent1 = await createTestParent(tx, user1.id);

      const user2 = await createTestUser(tx, { name: "Parent Two", email: `p2-${randomUUID()}@test.com` });
      const parent2 = await createTestParent(tx, user2.id);

      await createOverdueInvoice(tx, parent1.id, "75.00", -3);
      await createOverdueInvoice(tx, parent2.id, "125.00", -7);

      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.totalOverdueInvoices).toBe(2);
      expect(result.totalOverdueAmount).toBe("200.00");
      expect(result.items).toHaveLength(2);

      const parent1Item = result.items.find(i => i.id === parent1.id);
      const parent2Item = result.items.find(i => i.id === parent2.id);

      expect(parent1Item?.totalUnpaidAmount).toBe("75.00");
      expect(parent2Item?.totalUnpaidAmount).toBe("125.00");
    });
  });
});

describe("BillingRepository — getInvoicesForParent", () => {
  test("returns invoice history for a parent with invoices", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Billing Parent Hist",
        email: `billing-hist-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      const inv1 = await createOverdueInvoice(tx, parent.id, "120.00", -5, "UNPAID");
      const inv2 = await createOverdueInvoice(tx, parent.id, "80.00", -10, "PAID");

      const history = await BillingRepository.getInvoicesForParent(parent.id, tx);

      expect(Array.isArray(history)).toBeTrue();
      expect(history.length).toBe(2);

      const itemsMap = new Map(history.map(item => [item.id, item]));

      const item1 = itemsMap.get(inv1.id);
      expect(item1).toBeDefined();
      expect(item1?.issueDate).toBe(inv1.issueDate);
      expect(item1?.dueDate).toBe(inv1.dueDate);
      expect(item1?.amount).toBe("120.00");
      expect(item1?.currency).toBe("USD");
      expect(item1?.status).toBe("UNPAID");
      expect(item1?.invoiceType).toBe("MONTHLY");
      expect(item1?.paidDate).toBeNull();

      const item2 = itemsMap.get(inv2.id);
      expect(item2).toBeDefined();
      expect(item2?.amount).toBe("80.00");
      expect(item2?.status).toBe("PAID");
    });
  });

  test("returns empty array for parent with no invoices", async () => {
    await runInRollback(async tx => {
      const result = await BillingRepository.getInvoicesForParent("00000000-0000-0000-0000-000000000000", tx);
      expect(result).toEqual([]);
    });
  });

  test("excludes soft-deleted invoices", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Billing Parent Soft",
        email: `billing-soft-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      const now = new Date();
      // create a soft-deleted invoice directly
      const [softDeletedInv] = await tx
        .insert(invoices)
        .values({
          parentId: parent.id,
          issueDate: now.toISOString().split("T")[0],
          dueDate: now.toISOString().split("T")[0],
          amount: "150.00",
          currency: "USD",
          status: "UNPAID",
          invoiceType: "MONTHLY",
          idempotencyKey: randomUUID(),
          deletedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const result = await BillingRepository.getInvoicesForParent(parent.id, tx);
      expect(result.some(item => item.id === softDeletedInv.id)).toBeFalse();
    });
  });
});
