import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { invoices, systemSettings } from "@/backend/db/schema";
import { PaymentGateway } from "@/backend/enum";
import { AccountingPaymentService } from "@/backend/services/billing";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { AccountingPaymentReturnType, AccountingPaymentSubmitInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  type AccountingJourneyCast,
  cleanupAccountingJourneyCast,
  expectJourneyError,
  provisionAccountingJourneyCast,
} from "@/test/workflows/helpers";

/**
 * Cross-actor journey: an academy admin toggles the Paid status of accounting
 * payments and the parent invoice status cascades (PAID/UNPAID + paidDate)
 * according to the paid-sibling rule and the
 * `accounting_paid_toggle_auto_flips_invoice` system setting; a view-only
 * staff member observes every flip through the VIEW reads but cannot mutate.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): accounting services spawn their own top-level
 * transactions, so fixtures are committed in beforeAll and hard-deleted in
 * afterAll via the cast helpers.
 *
 * Layer note: the `toggleAccountingPaymentPaidStatus` GraphQL resolver repeats
 * the ACCOUNTING_PAYMENTS_MANAGE gate before delegating
 * (backend/graphql/mutation/billing/accounting.mutation.ts). A service-level
 * journey cannot reach that wrapper honestly (no HTTP stack in this layer), so
 * resolver-level denial is asserted in the GraphQL integration layer instead;
 * here the SERVICE-level gate is the honest assertion point.
 */
async function readInvoice(invoiceId: string) {
  const [row] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!row) throw new Error(`invoice ${invoiceId} missing`);
  return row;
}

describe("Toggle paid status → invoice cascade journey (admin toggles; view-only staff observe)", () => {
  const PREFIX = `jrn_acctog_${randomUUID().slice(0, 8)}`;
  const PAYMENT_DAY = new Date("2026-08-02T12:00:00.000Z");
  const AUTO_FLIP_KEY = "accounting_paid_toggle_auto_flips_invoice";

  let tErrors: ErrorsLabels;
  let cast: AccountingJourneyCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let primary: AccountingPaymentReturnType;
  let sibling: AccountingPaymentReturnType;

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // recordPayment dispatches payment-recorded notifications fire-and-forget;
    // the spy keeps the journey away from every real channel.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionAccountingJourneyCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    await cleanupAccountingJourneyCast(cast);
  });

  function submitInput(overrides: Partial<AccountingPaymentSubmitInput> = {}): AccountingPaymentSubmitInput {
    return {
      studentId: cast.student.id,
      packagePlanId: cast.plan.id,
      creditHours: 10,
      amount: 300,
      currency: CurrencyCode.USD,
      paymentGateway: PaymentGateway.PAYPAL,
      paymentDate: PAYMENT_DAY,
      isPaidStatusOn: true,
      paymentNote: `${PREFIX} toggle journey`,
      ...overrides,
    };
  }

  /** VIEW-only staff observation: detail + student-scoped list read. */
  async function staffReadsOf(paymentId: string) {
    const detail = await AccountingPaymentService.getById(cast.staffViewerUser.id, paymentId, tErrors);
    const list = await AccountingPaymentService.listPaginated(
      cast.staffViewerUser.id,
      { studentId: cast.student.id },
      null,
      tErrors
    );
    return { detail, listed: list.rows.find(row => row.id === paymentId) };
  }

  test("step 1 — admin records a paid payment; the derived invoice is PAID with a paidDate", async () => {
    primary = await AccountingPaymentService.recordPayment(cast.adminUser.id, submitInput(), tErrors);

    expect(primary.isPaidStatusOn).toBe(true);
    expect(primary.invoiceStatus).toBe("PAID");

    const invoice = await readInvoice(primary.invoiceId);
    expect(invoice.status).toBe("PAID");
    expect(invoice.paidDate).toBe("2026-08-02");
  });

  test("step 2 — a gateway-varied payment shares the invoice; toggling one payment off keeps it PAID while a paid sibling remains", async () => {
    // The derived invoice idempotency key excludes the gateway, so this second
    // submission lands on the SAME invoice (split-payment path).
    sibling = await AccountingPaymentService.recordPayment(
      cast.adminUser.id,
      submitInput({ paymentGateway: PaymentGateway.WESTERN_UNION }),
      tErrors
    );
    expect(sibling.invoiceId).toBe(primary.invoiceId);

    const toggled = await AccountingPaymentService.togglePaidStatus(
      cast.adminUser.id,
      { id: primary.id, isPaidStatusOn: false },
      tErrors
    );
    expect(toggled.isPaidStatusOn).toBe(false);
    expect(toggled.invoiceStatus).toBe("PAID");

    const invoice = await readInvoice(primary.invoiceId);
    expect(invoice.status).toBe("PAID");
    expect(invoice.paidDate).toBe("2026-08-02");

    // VIEW-only staff observe the flipped payment flag and the (unchanged)
    // invoice status through both read surfaces.
    const staffView = await staffReadsOf(primary.id);
    expect(staffView.detail.isPaidStatusOn).toBe(false);
    expect(staffView.detail.invoiceStatus).toBe("PAID");
    expect(staffView.listed?.invoiceStatus).toBe("PAID");
  });

  test("step 3 — toggling off the last paid sibling flips the invoice to UNPAID; toggling back on restores PAID", async () => {
    const unpaid = await AccountingPaymentService.togglePaidStatus(
      cast.adminUser.id,
      { id: sibling.id, isPaidStatusOn: false },
      tErrors
    );
    expect(unpaid.isPaidStatusOn).toBe(false);
    expect(unpaid.invoiceStatus).toBe("UNPAID");

    const unpaidInvoice = await readInvoice(primary.invoiceId);
    expect(unpaidInvoice.status).toBe("UNPAID");
    expect(unpaidInvoice.paidDate).toBeNull();

    // View-only staff see the UNPAID flip on detail + list reads.
    const staffView = await staffReadsOf(sibling.id);
    expect(staffView.detail.invoiceStatus).toBe("UNPAID");
    expect(staffView.listed?.invoiceStatus).toBe("UNPAID");

    // Toggle one payment back ON: invoice returns to PAID with the toggled
    // payment's date as paidDate.
    const backOn = await AccountingPaymentService.togglePaidStatus(
      cast.adminUser.id,
      { id: primary.id, isPaidStatusOn: true },
      tErrors
    );
    expect(backOn.isPaidStatusOn).toBe(true);
    expect(backOn.invoiceStatus).toBe("PAID");

    const paidInvoice = await readInvoice(primary.invoiceId);
    expect(paidInvoice.status).toBe("PAID");
    expect(paidInvoice.paidDate).toBe("2026-08-02");
  });

  test("step 4 — a stale expectedInvoiceVersion is rejected and nothing changes", async () => {
    const current = await readInvoice(primary.invoiceId);
    const staleVersion = current.version - 1;

    const lockError = await expectJourneyError(() =>
      AccountingPaymentService.togglePaidStatus(
        cast.adminUser.id,
        { id: sibling.id, isPaidStatusOn: true, expectedInvoiceVersion: staleVersion },
        tErrors
      )
    );
    expect(lockError.message).toBe(
      tErrors.billing.invoiceVersionMismatch({
        id: primary.invoiceId,
        expectedVersion: staleVersion,
        gotVersion: current.version,
      })
    );

    // The conflict fires before any write: payment flag and invoice stay put.
    const after = await readInvoice(primary.invoiceId);
    expect(after.status).toBe("PAID");
    expect(after.version).toBe(current.version);
    const siblingView = await AccountingPaymentService.getById(cast.adminUser.id, sibling.id, tErrors);
    expect(siblingView.isPaidStatusOn).toBe(false);
  });

  test("step 5 — accounting_paid_toggle_auto_flips_invoice=false decouples payment flags from invoice status", async () => {
    const [original] = await db.select().from(systemSettings).where(eq(systemSettings.key, AUTO_FLIP_KEY)).limit(1);
    const originalValue = original?.value ?? "true";
    await db
      .update(systemSettings)
      .set({ value: "false", updatedAt: new Date() })
      .where(eq(systemSettings.key, AUTO_FLIP_KEY));
    try {
      // Turning the last paid payment OFF must NOT flip the invoice when the
      // setting disables the cascade (no paid siblings remain at this point).
      const off = await AccountingPaymentService.togglePaidStatus(
        cast.adminUser.id,
        { id: primary.id, isPaidStatusOn: false },
        tErrors
      );
      expect(off.isPaidStatusOn).toBe(false);
      expect(off.invoiceStatus).toBe("PAID");

      const decoupled = await readInvoice(primary.invoiceId);
      expect(decoupled.status).toBe("PAID");
      expect(decoupled.paidDate).toBe("2026-08-02");

      // Turning it back ON is decoupled too — the invoice never moved.
      const on = await AccountingPaymentService.togglePaidStatus(
        cast.adminUser.id,
        { id: primary.id, isPaidStatusOn: true },
        tErrors
      );
      expect(on.isPaidStatusOn).toBe(true);
      expect((await readInvoice(primary.invoiceId)).status).toBe("PAID");
    } finally {
      await db
        .update(systemSettings)
        .set({ value: originalValue, updatedAt: new Date() })
        .where(eq(systemSettings.key, AUTO_FLIP_KEY));
    }
  });

  test("step 6 — VIEW-only staff and unrelated actors cannot toggle; nothing is written", async () => {
    const [staffError, outsiderError] = await Promise.all([
      expectJourneyError(() =>
        AccountingPaymentService.togglePaidStatus(
          cast.staffViewerUser.id,
          { id: sibling.id, isPaidStatusOn: true },
          tErrors
        )
      ),
      expectJourneyError(() =>
        AccountingPaymentService.togglePaidStatus(
          cast.unrelatedParentUser.id,
          { id: sibling.id, isPaidStatusOn: true },
          tErrors
        )
      ),
    ]);
    expect(staffError.message).toContain(tErrors.insufficientPermissions);
    expect(outsiderError.message).toContain(tErrors.insufficientPermissions);

    // requirePermission rejects before any DB write.
    const invoice = await readInvoice(primary.invoiceId);
    expect(invoice.status).toBe("PAID");
    const siblingView = await AccountingPaymentService.getById(cast.adminUser.id, sibling.id, tErrors);
    expect(siblingView.isPaidStatusOn).toBe(false);
  });
});
