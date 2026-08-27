import { createHash } from "node:crypto";
import { db } from "@/backend/db/drizzleDb";
import {
  AccountingPaymentRepository,
  AccountingPaymentSupport,
  CreditRepository,
  PackagePlanRepository,
} from "@/backend/db/repo/billing";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { StudentRepository } from "@/backend/db/repo/students";
import { AppPermission } from "@/backend/enum";
import { ConflictError, logger, NotFoundError, ValidationError } from "@/backend/lib";
import { assertAssociatedOrManage, requirePermission } from "@/backend/services/billing/permission-utils";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import type {
  AccountingPaymentBalanceReturnType,
  AccountingPaymentFilter,
  AccountingPaymentReturnType,
  AccountingPaymentSubmitInput,
  AccountingPaymentTogglePaidInput,
  AccountingPaymentUpdateInput,
  DBTransaction,
  PaginationArgs,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Type guard for objects with a string `code` property (Postgres errors). */
function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  );
}

const isUniqueViolation = (error: unknown): boolean => hasErrorCode(error) && error.code === "23505";
const isoDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

/** Deterministic invoice idempotency key (content-addressed, replay-safe). */
function deriveInvoiceIdempotencyKey(input: AccountingPaymentSubmitInput): string {
  const content = JSON.stringify([
    input.studentId,
    input.packagePlanId ?? "",
    String(input.amount),
    input.currency,
    isoDateOnly(input.paymentDate),
  ]);
  return `acctinv-${createHash("sha256").update(content).digest("hex")}`;
}

export namespace AccountingPaymentService {
  /** Re-validates the plan row inside the tx (EC-2 archival race window). */
  async function revalidatePackageInsideTx(
    planId: string | null | undefined,
    tErrors: ErrorsLabels,
    tx: DBTransaction
  ) {
    if (!planId) return null;
    const plan = await PackagePlanRepository.findById(planId, tx);
    if (!plan || !plan.active || plan.deletedAt !== null) {
      throw new NotFoundError("PACKAGE_PLAN", tErrors.package.planArchived(planId ?? ""));
    }
    return plan;
  }

  export async function recordPayment(
    actorUserId: string,
    input: AccountingPaymentSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    if (!Number.isFinite(input.amount) || input.amount <= 0)
      throw new ValidationError(tErrors.package.invalidInput);
    if (!Number.isFinite(input.creditHours) || input.creditHours <= 0)
      throw new ValidationError(tErrors.package.invalidInput);

    // Strict existence check (pre-tx fast-fail; EC-8 cascades protect invariants).
    const studentBasic = await AccountingPaymentSupport.findStudentById(input.studentId);
    if (!studentBasic) {
      throw new NotFoundError("STUDENT", tErrors.studentNotFound(input.studentId));
    }
    if (!studentBasic.parentId) {
      // invoices.parent_id is NOT NULL — v1 requires parent-linked students.
      throw new ValidationError(tErrors.package.invalidInput);
    }
    // Hoist into a narrowed local so the tx closure keeps the string type.
    const parentId: string = studentBasic.parentId;

    const idempotencyKey = AccountingPaymentRepository.generateIdempotencyKey({
      studentId: input.studentId,
      packagePlanId: input.packagePlanId ?? null,
      amount: String(input.amount),
      currency: input.currency,
      paymentDate: input.paymentDate,
      paymentGateway: input.paymentGateway,
    });

    try {
      const created = await db.transaction(async tx => {
        // EC-13/EC-15/EC-16: serialize every balance-affecting op per student.
        await acquireAdvisoryLock(tx, `student_${input.studentId}`);
        await revalidatePackageInsideTx(input.packagePlanId, tErrors, tx);

        // US-2.1 AC#4 — duplicates RETURN the existing row (no ConflictError).
        const existing = await AccountingPaymentSupport.findByIdempotencyKeys([idempotencyKey], tx);
        if (existing.length > 0 && existing[0]) {
          const joined = await AccountingPaymentRepository.findById(existing[0].id, tx);
          if (joined) return joined;
        }

        const invoice = await AccountingPaymentSupport.createInvoice(tx, {
          parentId,
          studentId: input.studentId,
          issueDate: isoDateOnly(input.paymentDate),
          dueDate: isoDateOnly(input.paymentDate),
          paidDate: input.isPaidStatusOn ? isoDateOnly(input.paymentDate) : null,
          amount: String(input.amount),
          currency: input.currency,
          status: input.isPaidStatusOn ? "PAID" : "UNPAID",
          invoiceType: "CREDIT_HOURS_PACKAGE",
          createdByUserId: actorUserId,
          idempotencyKey: deriveInvoiceIdempotencyKey(input),
        });

        const payment = await AccountingPaymentRepository.create(tx, {
          invoiceId: invoice.id,
          amount: String(input.amount),
          currency: input.currency,
          paymentDate: input.paymentDate,
          packagePlanId: input.packagePlanId ?? null,
          paymentGateway: input.paymentGateway,
          creditHours: String(input.creditHours),
          isPaidStatusOn: Boolean(input.isPaidStatusOn),
          paymentNote: input.paymentNote ?? null,
          idempotencyKey,
        });

        // Hour ledger row + live balance bump inside the same tx.
        await CreditRepository.createHourPurchase(tx, {
          studentId: input.studentId,
          hours: input.creditHours,
          sourcePaymentId: payment.id,
          creditedByUserId: actorUserId,
          notes: input.paymentNote ?? null,
          idempotencyKey: `${idempotencyKey}:ledger-hour-purchase`,
        });
        await StudentRepository.addCreditHours(input.studentId, tErrors, input.creditHours, undefined, tx);

        logger.info("Accounting payment recorded", {
          actorUserId,
          studentId: input.studentId,
          paymentId: payment.id,
          invoiceId: invoice.id,
          creditHours: input.creditHours,
          gateway: input.paymentGateway,
        });

        const joined = await AccountingPaymentRepository.findById(payment.id, tx);
        if (!joined) throw new Error("accounting payment post-read failed");
        return joined;
      });

      return created;
    } catch (error) {
      // EC-1 concurrent duplicate: unique-violation → return the winner's row.
      if (isUniqueViolation(error)) {
        const resolved = await AccountingPaymentSupport.findByIdempotencyKeys([idempotencyKey]);
        if (resolved.length > 0 && resolved[0]) {
          const joined = await AccountingPaymentRepository.findById(resolved[0].id);
          if (joined) return joined;
        }
      }
      logger.error("Failed to record accounting payment", {
        actorUserId,
        studentId: input.studentId,
        error,
      });
      throw error;
    }
  }

  export async function togglePaidStatus(
    actorUserId: string,
    input: AccountingPaymentTogglePaidInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    const current = await AccountingPaymentRepository.findById(input.id);
    if (!current) {
      throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(input.id));
    }

    const updated = await db.transaction(async tx => {
      // EC-14: serialize invoice status mutations per invoice BEFORE reading it.
      await acquireAdvisoryLock(tx, `invoice_${current.invoiceId}`);

      const invoice = await AccountingPaymentSupport.findInvoiceById(current.invoiceId, tx);
      if (!invoice) throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(current.invoiceId));

            // `!= null` (not `!== undefined`): GraphQL codegen requires the KEY in
      // Exact variable objects, so clients pass explicit null to SKIP the lock.
      if (input.expectedInvoiceVersion != null && invoice.version !== input.expectedInvoiceVersion) {
        throw new ConflictError(
          tErrors.billing.invoiceVersionMismatch({
            id: invoice.id,
            expectedVersion: input.expectedInvoiceVersion,
            gotVersion: invoice.version,
          })
        );
      }

      const setting = await SystemSettingsService.getSettingByKey(
        "accounting_paid_toggle_auto_flips_invoice",
        tx
      );
      const autoFlip = setting ? setting.value !== "false" : true;

      await AccountingPaymentRepository.update(tx, current.id, { isPaidStatusOn: input.isPaidStatusOn });

      if (autoFlip) {
        if (input.isPaidStatusOn) {
          await AccountingPaymentSupport.updateInvoicePaidFields(
            tx,
            current.invoiceId,
            { status: "PAID", paidDate: isoDateOnly(current.paymentDate) },
            invoice.version
          );
        } else {
          // EC-3: drop to UNPAID only when no other paid sibling remains.
          const siblings = await AccountingPaymentRepository.findPaidSiblingsByInvoice(
            tx,
            current.invoiceId,
            current.id
          );
          if (siblings.length === 0) {
            await AccountingPaymentSupport.updateInvoicePaidFields(
              tx,
              current.invoiceId,
              { status: "UNPAID", paidDate: null },
              invoice.version
            );
          }
        }
      }

      const joined = await AccountingPaymentRepository.findById(current.id, tx);
      if (!joined) throw new Error("accounting payment post-toggle read failed");
      return joined;
    });

    logger.info("Accounting payment paid-status toggled", {
      actorUserId,
      paymentId: current.id,
      isPaidStatusOn: input.isPaidStatusOn,
    });
    return updated;
  }

  export async function update(
    actorUserId: string,
    input: AccountingPaymentUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);

    const current = await AccountingPaymentRepository.findById(input.id);
    if (!current) {
      throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(input.id));
    }

    const oldHours = current.creditHours === null ? 0 : Number(current.creditHours);
    const hoursChanged = input.creditHours !== undefined && Math.abs(input.creditHours - oldHours) > 1e-9;

    if (!hoursChanged) {
      // Gateway/note-only edits: single-statement update, no ledger effects.
      await db.transaction(async tx => {
        await AccountingPaymentRepository.update(tx, current.id, {
          paymentGateway: input.paymentGateway,
          paymentNote: input.paymentNote,
        });
      });
      const joined = await AccountingPaymentRepository.findById(current.id);
      if (!joined) throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(current.id));
      return joined;
    }

    const newHours = input.creditHours as number;
    const updated = await db.transaction(async tx => {
      // EC-15/EC-16: serialized per student alongside recordPayment.
      await acquireAdvisoryLock(tx, `student_${current.studentId ?? ""}`);

      const delta = Number((newHours - oldHours).toFixed(2));
      if (delta > 0) {
        await StudentRepository.addCreditHours(current.studentId as string, tErrors, delta, undefined, tx);
      } else if (delta < 0) {
        await StudentRepository.deductCreditHours(
          current.studentId as string,
          tErrors,
          Math.abs(delta),
          undefined,
          tx
        );
      }

      await CreditRepository.createHourAdjustment(tx, {
        studentId: current.studentId as string,
        delta,
        sourcePaymentId: current.id,
        creditedByUserId: actorUserId,
        notes: input.paymentNote ?? null,
        idempotencyKey: AccountingPaymentRepository.generateIdempotencyKey({
          studentId: current.studentId ?? "",
          packagePlanId: current.packagePlanId,
          amount: current.amount,
          currency: current.currency,
          paymentDate: current.updatedAt,
          paymentGateway: input.paymentGateway ?? current.paymentGateway,
        }).replace("acctpay-", "acct-edit-"),
      });

      await AccountingPaymentRepository.update(tx, current.id, {
        creditHours: String(newHours),
        paymentGateway: input.paymentGateway,
        paymentNote: input.paymentNote,
      });
      await AccountingPaymentSupport.updateInvoiceCreditHours(tx, current.invoiceId, String(newHours));

      const joined = await AccountingPaymentRepository.findById(current.id, tx);
      if (!joined) throw new Error("accounting payment post-update read failed");
      return joined;
    });

    logger.info("Accounting payment updated", { actorUserId, paymentId: current.id, oldHours, newHours });
    return updated;
  }

  export async function getById(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentReturnType> {
    const row = await AccountingPaymentRepository.findById(id);
    if (!row) {
      throw new NotFoundError("PAYMENT", tErrors.billing.invoiceNotFound(id));
    }
    if (row.studentId) {
      await assertAssociatedOrManage(actorUserId, row.studentId, tErrors, AppPermission.ACCOUNTING_PAYMENTS_VIEW);
    } else {
      await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_VIEW, tErrors);
    }
    return row;
  }

  export async function listPaginated(
    actorUserId: string,
    filter: AccountingPaymentFilter,
    paginationArgs: PaginationArgs | null,
    tErrors: ErrorsLabels
  ): Promise<{ rows: AccountingPaymentReturnType[]; totalCount: number }> {
    if (filter.studentId) {
      // Student-scoped list: associated users OR holders of VIEW.
      await assertAssociatedOrManage(actorUserId, filter.studentId, tErrors, AppPermission.ACCOUNTING_PAYMENTS_VIEW);
    } else {
      await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_VIEW, tErrors);
    }

    const [rows, totalCount] = await Promise.all([
      AccountingPaymentRepository.listPaginated(filter, paginationArgs),
      AccountingPaymentRepository.countForFilter(filter),
    ]);
    return { rows, totalCount };
  }

  export async function getStudentBalance(
    actorUserId: string,
    studentId: string,
    tErrors: ErrorsLabels
  ): Promise<AccountingPaymentBalanceReturnType> {
    await assertAssociatedOrManage(actorUserId, studentId, tErrors, AppPermission.ACCOUNTING_PAYMENTS_VIEW);
    return await StudentRepository.getCreditHourBalance(studentId);
  }
}
