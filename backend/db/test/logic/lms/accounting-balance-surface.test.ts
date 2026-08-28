import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { invoices, parents, payments, students, systemSettings, users } from "@/backend/db/schema";
import { createTestParent, createTestStudent, createTestUser } from "@/backend/db/test/entity-setup";
import { PaymentGateway } from "@/backend/enum";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { AccountingPaymentService } from "@/backend/services/billing/accounting-payment.service";
import {
  DEFAULT_LOW_HOURS_THRESHOLD,
  LOW_HOURS_THRESHOLD_SETTING_KEY,
} from "@/backend/services/billing/accounting-settings.utils";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

/**
 * The balance service resolves its enrichment fields against committed data
 * through its own bare reads (no tx parameter), so fixtures here are created
 * COMMITTED and hard-deleted afterwards.
 */

async function overwriteThresholdSetting(value: string): Promise<void> {
  await SystemSettingsRepository.upsertSetting({
    key: LOW_HOURS_THRESHOLD_SETTING_KEY,
    value,
    dataType: SystemSettingDataType.String,
    description: "",
    category: SystemSettingCategory.Billing,
  });
}

async function restoreThresholdSetting(original: typeof systemSettings.$inferSelect | undefined): Promise<void> {
  if (!original) {
    await SystemSettingsRepository.deleteSetting(LOW_HOURS_THRESHOLD_SETTING_KEY);
    return;
  }
  await SystemSettingsRepository.upsertSetting({
    key: original.key,
    value: original.value,
    dataType: original.dataType,
    description: original.description,
    category: original.category,
    updatedByUserId: original.updatedByUserId,
  });
}

describe("Accounting balance surface", () => {
  let tErrors: ErrorsLabels;
  let actorUserId = "";
  let parentUserId = "";
  let parentRowId = "";
  let studentLoginId = "";
  let studentRowId = "";

  /** Rows produced by the currency fixture; wiped eagerly per test + defensively here. */
  const trackedInvoiceIds: string[] = [];
  const trackedPaymentIds: string[] = [];

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;

    await db.transaction(async tx => {
      const actor = await createTestUser(tx, { isSuperAdmin: true });
      const parentUser = await createTestUser(tx);
      const studentLogin = await createTestUser(tx);
      const parentRow = await createTestParent(tx, parentUser.id);
      const studentRow = await createTestStudent(tx, parentRow.id, { userId: studentLogin.id });

      actorUserId = actor.id;
      parentUserId = parentUser.id;
      parentRowId = parentRow.id;
      studentLoginId = studentLogin.id;
      studentRowId = studentRow.id;
    });
  });

  afterAll(async () => {
    if (!studentRowId) return;

    if (trackedPaymentIds.length > 0) {
      await db.delete(payments).where(inArray(payments.id, trackedPaymentIds));
    }
    if (trackedInvoiceIds.length > 0) {
      await db.delete(invoices).where(inArray(invoices.id, trackedInvoiceIds));
    }

    const identityIds = [actorUserId, parentUserId, studentLoginId].filter(Boolean);
    await db.transaction(async tx => {
      await tx.delete(students).where(inArray(students.id, [studentRowId]));
      await tx.delete(parents).where(inArray(parents.id, [parentRowId]));
      await tx.delete(users).where(inArray(users.id, identityIds));
    });
  });

  async function insertCommittedInvoice(): Promise<string> {
    const now = new Date();
    const [invoice] = await db
      .insert(invoices)
      .values({
        parentId: parentRowId,
        studentId: studentRowId,
        issueDate: "2026-07-01",
        dueDate: "2026-07-01",
        amount: "100.00",
        currency: CurrencyCode.USD,
        status: "PAID",
        invoiceType: "CREDIT_HOURS_PACKAGE",
        idempotencyKey: `acct-bal-inv-${randomUUID()}`,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    trackedInvoiceIds.push(invoice.id);
    return invoice.id;
  }

  async function insertCommittedPayment(invoiceId: string, currency: CurrencyCode, paymentDate: Date): Promise<string> {
    const now = new Date();
    const [payment] = await db
      .insert(payments)
      .values({
        invoiceId,
        amount: "100.00",
        currency,
        paymentDate,
        packagePlanId: null,
        paymentGateway: PaymentGateway.BANK,
        creditHours: "10.00",
        isPaidStatusOn: true,
        paymentNote: null,
        refundedAmount: "0.00",
        paymentMethodType: PaymentMethodType.CASH,
        paymentMethodSnapshot: {
          userPaymentMethodId: null,
          type: PaymentMethodType.CASH,
          direction: PaymentDirection.PAYIN,
          label: PaymentGateway.BANK,
          details: {},
          catalog: null,
          snapshottedAt: now.toISOString(),
        },
        idempotencyKey: `acct-bal-pay-${randomUUID()}`,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    trackedPaymentIds.push(payment.id);
    return payment.id;
  }

  function balanceFor(studentId: string) {
    return AccountingPaymentService.getStudentBalance(actorUserId, studentId, tErrors);
  }

  test("lowHoursThreshold mirrors the persisted setting, its built-in fallback and its garbage guard", async () => {
    const [original] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, LOW_HOURS_THRESHOLD_SETTING_KEY))
      .limit(1);

    try {
      // A custom persisted value is passed through verbatim.
      await overwriteThresholdSetting("3.5");
      expect((await balanceFor(studentRowId)).lowHoursThreshold).toBe(3.5);

      // A non-numeric value surfaces as null instead of a misleading number.
      await overwriteThresholdSetting("not-a-number");
      expect((await balanceFor(studentRowId)).lowHoursThreshold).toBeNull();

      // Removing the row falls back to the shipped built-in default.
      await SystemSettingsRepository.deleteSetting(LOW_HOURS_THRESHOLD_SETTING_KEY);
      expect((await balanceFor(studentRowId)).lowHoursThreshold).toBe(DEFAULT_LOW_HOURS_THRESHOLD);
    } finally {
      await restoreThresholdSetting(original);
    }
  });

  test("lastPaymentCurrency is null without payments and otherwise the newest payment's currency", async () => {
    // No payments reference a freshly generated id — the surface must stay null.
    expect((await balanceFor(randomUUID())).lastPaymentCurrency).toBeNull();

    // Insert the NEWER-EUR payment first and the OLDER-USD one second so only
    // date-based selection can produce EUR (insertion order alone would pick USD).
    const invoiceId = await insertCommittedInvoice();
    const eurPaymentId = await insertCommittedPayment(
      invoiceId,
      CurrencyCode.EUR,
      new Date("2026-07-20T12:00:00.000Z")
    );
    const usdPaymentId = await insertCommittedPayment(
      invoiceId,
      CurrencyCode.USD,
      new Date("2026-07-03T12:00:00.000Z")
    );
    expect(eurPaymentId).not.toBe(usdPaymentId);

    const withPayments = await balanceFor(studentRowId);
    expect(withPayments.lastPaymentCurrency).toBe(CurrencyCode.EUR);

    // Removing every payment returns the field to null for the SAME student,
    // proving it is derived from data rather than memoised or defaulted.
    await db.delete(payments).where(eq(payments.id, eurPaymentId));
    await db.delete(payments).where(eq(payments.id, usdPaymentId));
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
    expect((await balanceFor(studentRowId)).lastPaymentCurrency).toBeNull();

    trackedInvoiceIds.length = 0;
    trackedPaymentIds.length = 0;
  });
});
