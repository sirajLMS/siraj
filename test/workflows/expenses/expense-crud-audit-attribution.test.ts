import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs, expenses } from "@/backend/db/schema";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { ExpenseService, requirePermission } from "@/backend/services";
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";
import type { ExpenseRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import {
  cleanupExpenseCrudCast,
  type ExpenseCrudCast,
  expectJourneyError,
  provisionExpenseCrudCast,
} from "@/test/workflows/helpers";

/** Audit-log action/entity constants for the expense ledger mutations. */
const EXPENSE_ENTITY_TYPE = "EXPENSE";
const EXPENSE_ACTION_CREATE = "EXPENSE_CREATE";
const EXPENSE_ACTION_UPDATE = "EXPENSE_UPDATE";
const EXPENSE_ACTION_DELETE = "EXPENSE_DELETE";

const REPORT_PAGE = { limit: 50, offset: 0 };

const PAYMENT_DATE = new Date().toISOString().slice(0, 10);
const EXPENSE_MONTH = PAYMENT_DATE.slice(0, 7);

/** sonarjs/no-alphabetical-sort compliant ordering for id-list equality checks. */
const compareIds = (left: string, right: string): number => left.localeCompare(right);

const SERVER_VALUE_BEFORE = "150.00";
const SERVER_VALUE_AFTER = "175.50";
const FLYER_VALUE = "42.50";
const BOTH_TOTAL = "218.00";

/** Structural guard for jsonb audit metadata — no blind member access. */
function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function treatAsMetadata(value: unknown): Record<string, unknown> {
  if (!isMetadataRecord(value)) {
    throw new Error("expected metadata object");
  }
  return value;
}

/**
 * Cross-actor journey: an accounting operator (academy_admin, VIEW + MANAGE)
 * creates, edits, and soft-deletes manual expenses while a VIEW-only auditor
 * observes every committed result — including the audit trail with the real
 * actor attribution — and every one of its own mutations is rejected before
 * any write. An outsider holding neither permission is blocked from reads and
 * mutations alike. Soft-deleted rows are never hard-deleted, disappear from
 * the default report aggregates, and stay readable through the audit surface.
 *
 * Layer note (CSV export): the journey has no HTTP layer, so the export
 * route's 403 surface is covered in `app/api/expenses/export/route.test.ts`;
 * here the exact gate the route delegates to — `requirePermission(userId,
 * ACCOUNTING_EXPENSES_VIEW)` followed by `ExpenseService.getReport` — is
 * asserted against the real permission store for the MANAGE-less outsider
 * (step 8), and the auditor's VIEW gate is probed in step 2. Route level the
 * export requires VIEW, not MANAGE.
 *
 * Runs UNWRAPPED from any rollback transaction by design (see
 * test/workflows/AGENTS.md): services spawn their own top-level transactions
 * over the global `db`, so fixtures are committed in beforeAll and hard-
 * deleted in afterAll via the cast helpers.
 */
describe("Expense CRUD audit attribution journey (operator → auditor)", () => {
  const PREFIX = `jrn_expcrud_${randomUUID().slice(0, 8)}`;
  const TITLE_SERVER = `${PREFIX} Server bill`;
  const TITLE_SERVER_EDITED = `${PREFIX} Server bill (corrected)`;
  const TITLE_FLYER = `${PREFIX} Flyer print`;
  const DELETE_REASON = `${PREFIX} duplicate entry`;
  const REPORT_FILTERS = {
    title: PREFIX,
    types: null,
    expenseDate: null,
    paymentDateFrom: null,
    paymentDateTo: null,
    includeDeleted: null,
  };

  let tErrors: ErrorsLabels;
  let cast: ExpenseCrudCast;
  let dispatchSpy: ReturnType<typeof spyOn>;
  let serverExpense: ExpenseRow;
  let flyerExpense: ExpenseRow;
  const createdExpenseIds: string[] = [];

  async function expenseAuditRows(entityIds: string[], action?: string) {
    const conditions = [eq(auditLogs.entityType, EXPENSE_ENTITY_TYPE), inArray(auditLogs.entityId, entityIds)];
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    return db
      .select()
      .from(auditLogs)
      .where(and(...conditions));
  }

  beforeAll(async () => {
    tErrors = getServerTranslations("en").errorsTranslations;
    // Interception boundary for notification dispatch: expense CRUD dispatches
    // nothing, so a live spy that sees any call at all proves a channel would
    // have been hit for real.
    dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
    cast = await provisionExpenseCrudCast(PREFIX);
  });

  afterAll(async () => {
    dispatchSpy.mockRestore();
    // Committed expense audit rows reference the cast actors; the immutability
    // trigger must be lifted for the sweep (carryover journey precedent).
    await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger`);
    try {
      if (createdExpenseIds.length > 0) {
        await db.delete(expenses).where(inArray(expenses.id, createdExpenseIds));
      }
      await db
        .delete(auditLogs)
        .where(inArray(auditLogs.actorUserId, [cast.operatorUser.id, cast.auditorUser.id, cast.outsiderUser.id]));
      await cleanupExpenseCrudCast(cast);
    } finally {
      await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER prevent_audit_log_mod_trigger`);
    }
  });

  test("step 1 — precondition: operator and auditor see an empty ledger window for this run", async () => {
    await Promise.all(
      [cast.operatorUser.id, cast.auditorUser.id].map(async readerId => {
        const report = await ExpenseService.getReport(readerId, REPORT_FILTERS, REPORT_PAGE, tErrors);
        expect(report.rows).toHaveLength(0);
        expect(report.totalCount).toBe(0);
      })
    );
  });

  test("step 2 — VIEW-only auditor: every mutation + the manage gate reject before any write", async () => {
    const missingId = randomUUID();
    const deniedCreate = await expectJourneyError(() =>
      ExpenseService.create(
        {
          title: TITLE_SERVER,
          type: ExpenseType.TECHNOLOGY,
          expenseValue: SERVER_VALUE_BEFORE,
          expenseCurrency: CurrencyCode.SAR,
          paymentDate: PAYMENT_DATE,
          expenseDate: EXPENSE_MONTH,
          createdByUserId: cast.auditorUser.id,
        },
        cast.auditorUser.id,
        tErrors
      )
    );
    expect(deniedCreate.message).toContain(tErrors.insufficientPermissions);

    const deniedUpdate = await expectJourneyError(() =>
      ExpenseService.update({ id: missingId, title: TITLE_SERVER_EDITED, actorUserId: cast.auditorUser.id }, tErrors)
    );
    expect(deniedUpdate.message).toContain(tErrors.insufficientPermissions);

    const deniedDelete = await expectJourneyError(() =>
      ExpenseService.softDelete({ id: missingId, actorUserId: cast.auditorUser.id, reason: DELETE_REASON }, tErrors)
    );
    expect(deniedDelete.message).toContain(tErrors.insufficientPermissions);

    const deniedBulk = await expectJourneyError(() =>
      ExpenseService.bulkDelete({ ids: [missingId], reason: DELETE_REASON, actorUserId: cast.auditorUser.id }, tErrors)
    );
    expect(deniedBulk.message).toContain(tErrors.insufficientPermissions);

    // The catalog grant is honest: VIEW resolves (CSV export path admission),
    // MANAGE does not (GraphQL mutation surface).
    await requirePermission(cast.auditorUser.id, AppPermission.ACCOUNTING_EXPENSES_VIEW, tErrors);
    const deniedManage = await expectJourneyError(() =>
      requirePermission(cast.auditorUser.id, AppPermission.ACCOUNTING_EXPENSES_MANAGE, tErrors)
    );
    expect(deniedManage.message).toContain(tErrors.insufficientPermissions);

    // Denials happened before any transaction: no expense rows, no audit rows.
    const stillEmpty = await ExpenseService.getReport(cast.operatorUser.id, REPORT_FILTERS, REPORT_PAGE, tErrors);
    expect(stillEmpty.totalCount).toBe(0);
    const auditorAuditRows = await db.select().from(auditLogs).where(eq(auditLogs.actorUserId, cast.auditorUser.id));
    expect(auditorAuditRows).toHaveLength(0);
  });

  test("step 3 — operator creates two expenses; forged createdByUserId is overridden by the acting user", async () => {
    const createInput = {
      title: TITLE_SERVER,
      type: ExpenseType.TECHNOLOGY,
      expenseValue: SERVER_VALUE_BEFORE,
      expenseCurrency: CurrencyCode.SAR,
      paymentDate: PAYMENT_DATE,
      expenseDate: EXPENSE_MONTH,
      note: `${PREFIX} note`,
      sourceEntity: null,
      sourceEntityId: null,
      createdByUserId: cast.auditorUser.id,
    };
    serverExpense = await ExpenseService.create(createInput, cast.operatorUser.id, tErrors);
    createdExpenseIds.push(serverExpense.id);

    flyerExpense = await ExpenseService.create(
      { ...createInput, title: TITLE_FLYER, type: ExpenseType.MARKETING, expenseValue: FLYER_VALUE, note: null },
      cast.operatorUser.id,
      tErrors
    );
    createdExpenseIds.push(flyerExpense.id);

    // Server-derived attribution: the client-supplied createdByUserId pointing
    // at the auditor is discarded — the acting operator is recorded.
    for (const row of [serverExpense, flyerExpense]) {
      expect(row.createdByUserId).toBe(cast.operatorUser.id);
      expect(row.createdByName).toBe(cast.operatorUser.name);
      expect(row.sourceEntity).toBeNull();
      expect(row.sourceEntityId).toBeNull();
      expect(row.deletedAt).toBeNull();
    }

    const created = await expenseAuditRows(createdExpenseIds, EXPENSE_ACTION_CREATE);
    expect(created).toHaveLength(2);
    for (const log of created) {
      expect(log.actorUserId).toBe(cast.operatorUser.id);
      expect(log.actorType).toBe("USER");
      expect(log.entityType).toBe(EXPENSE_ENTITY_TYPE);
    }
    const serverLog = created.find(log => log.entityId === serverExpense.id);
    const metadata = treatAsMetadata(serverLog?.metadata);
    expect(metadata.idempotencyKey).toBeNull();
    expect(metadata.type).toBe(ExpenseType.TECHNOLOGY);
    expect(metadata.value).toBe(SERVER_VALUE_BEFORE);
    expect(metadata.currency).toBe(CurrencyCode.SAR);
  });

  test("step 4 — operator edits the expense; EXPENSE_UPDATE carries previousValues and the acting user", async () => {
    const updated = await ExpenseService.update(
      {
        id: serverExpense.id,
        title: TITLE_SERVER_EDITED,
        expenseValue: SERVER_VALUE_AFTER,
        actorUserId: cast.operatorUser.id,
      },
      tErrors
    );
    expect(updated.title).toBe(TITLE_SERVER_EDITED);
    expect(updated.expenseValue).toBe(SERVER_VALUE_AFTER);
    expect(updated.createdByUserId).toBe(cast.operatorUser.id);

    const updates = await expenseAuditRows([serverExpense.id], EXPENSE_ACTION_UPDATE);
    expect(updates).toHaveLength(1);
    const updateLog = updates[0];
    expect(updateLog?.actorUserId).toBe(cast.operatorUser.id);
    const metadata = treatAsMetadata(updateLog?.metadata);
    expect(metadata.previousValues).toEqual({ title: TITLE_SERVER, expenseValue: SERVER_VALUE_BEFORE });
    expect(metadata.newValues).toEqual({ title: TITLE_SERVER_EDITED, expenseValue: SERVER_VALUE_AFTER });

    // Cross-actor visibility: the VIEW-only auditor reads the committed edit.
    const auditorView = await ExpenseService.getById(cast.auditorUser.id, serverExpense.id, tErrors);
    expect(auditorView.title).toBe(TITLE_SERVER_EDITED);
    expect(auditorView.expenseValue).toBe(SERVER_VALUE_AFTER);
    expect(auditorView.createdByUserId).toBe(cast.operatorUser.id);
  });

  test("step 5 — auditor reads the ledger report with page aggregates over both rows", async () => {
    const report = await ExpenseService.getReport(cast.auditorUser.id, REPORT_FILTERS, REPORT_PAGE, tErrors);
    expect(report.totalCount).toBe(2);
    expect(report.rows.map(row => row.id).toSorted(compareIds)).toEqual(
      [serverExpense.id, flyerExpense.id].toSorted(compareIds)
    );
    expect(report.aggregates.totalValue).toBe(BOTH_TOTAL);
    expect(report.aggregates.dominantCurrency).toBe(CurrencyCode.SAR);
    expect(report.aggregates.rowCountByType[ExpenseType.TECHNOLOGY]).toBe(1);
    expect(report.aggregates.rowCountByType[ExpenseType.MARKETING]).toBe(1);
    expect(report.aggregates.rowCountByType[ExpenseType.LOGISTICS]).toBe(0);
    expect(report.aggregates.rowCountByType[ExpenseType.SALARIES]).toBe(0);
  });

  test("step 6 — operator soft-deletes one expense: row retained, EXPENSE_DELETE attributed, idempotent replay", async () => {
    const deleted = await ExpenseService.softDelete(
      { id: flyerExpense.id, actorUserId: cast.operatorUser.id, reason: DELETE_REASON },
      tErrors
    );
    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.deletedByUserId).toBe(cast.operatorUser.id);
    expect(deleted.deletedReason).toBe(DELETE_REASON);

    // Soft-delete never hard-deletes: the row is still physically stored.
    const stored = await db.select().from(expenses).where(eq(expenses.id, flyerExpense.id));
    expect(stored).toHaveLength(1);
    expect(stored[0]?.deletedAt).not.toBeNull();
    expect(stored[0]?.deletedByUserId).toBe(cast.operatorUser.id);
    expect(stored[0]?.deletedReason).toBe(DELETE_REASON);

    const deletes = await expenseAuditRows([flyerExpense.id], EXPENSE_ACTION_DELETE);
    expect(deletes).toHaveLength(1);
    expect(deletes[0]?.actorUserId).toBe(cast.operatorUser.id);
    expect(treatAsMetadata(deletes[0]?.metadata).reason).toBe(DELETE_REASON);

    // Idempotent re-delete: same row back, no second write round, no new audit row.
    const replay = await ExpenseService.softDelete(
      { id: flyerExpense.id, actorUserId: cast.operatorUser.id, reason: DELETE_REASON },
      tErrors
    );
    expect(replay.deletedAt).toBe(deleted.deletedAt);
    expect(await expenseAuditRows([flyerExpense.id], EXPENSE_ACTION_DELETE)).toHaveLength(1);
  });

  test("step 7 — aggregates exclude soft-deleted rows; includeDeleted + getById keep the audit surface readable", async () => {
    const report = await ExpenseService.getReport(cast.operatorUser.id, REPORT_FILTERS, REPORT_PAGE, tErrors);
    expect(report.totalCount).toBe(1);
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]?.id).toBe(serverExpense.id);
    expect(report.aggregates.totalValue).toBe(SERVER_VALUE_AFTER);
    expect(report.aggregates.rowCountByType[ExpenseType.TECHNOLOGY]).toBe(1);
    expect(report.aggregates.rowCountByType[ExpenseType.MARKETING]).toBe(0);

    const withDeleted = await ExpenseService.getReport(
      cast.auditorUser.id,
      { ...REPORT_FILTERS, includeDeleted: true },
      REPORT_PAGE,
      tErrors
    );
    expect(withDeleted.totalCount).toBe(2);
    const struckRow = withDeleted.rows.find(row => row.id === flyerExpense.id);
    expect(struckRow?.deletedAt).not.toBeNull();
    expect(struckRow?.deletedByUserId).toBe(cast.operatorUser.id);

    // Soft-deleted rows stay drill-down readable so the audit trail explains the correction.
    const drilled = await ExpenseService.getById(cast.auditorUser.id, flyerExpense.id, tErrors);
    expect(drilled.deletedAt).not.toBeNull();
    expect(drilled.deletedReason).toBe(DELETE_REASON);
  });

  test("step 8 — actor with neither permission is blocked on every read and mutation", async () => {
    const outsider = cast.outsiderUser.id;
    const deniedReport = await expectJourneyError(() =>
      ExpenseService.getReport(outsider, REPORT_FILTERS, REPORT_PAGE, tErrors)
    );
    expect(deniedReport.message).toContain(tErrors.insufficientPermissions);

    const deniedDrillDown = await expectJourneyError(() => ExpenseService.getById(outsider, serverExpense.id, tErrors));
    expect(deniedDrillDown.message).toContain(tErrors.insufficientPermissions);

    const deniedCreate = await expectJourneyError(() =>
      ExpenseService.create(
        {
          title: TITLE_SERVER,
          type: ExpenseType.MARKETING,
          expenseValue: FLYER_VALUE,
          expenseCurrency: CurrencyCode.SAR,
          paymentDate: PAYMENT_DATE,
          expenseDate: EXPENSE_MONTH,
          createdByUserId: outsider,
        },
        outsider,
        tErrors
      )
    );
    expect(deniedCreate.message).toContain(tErrors.insufficientPermissions);

    const deniedBulk = await expectJourneyError(() =>
      ExpenseService.bulkDelete({ ids: [serverExpense.id], actorUserId: outsider }, tErrors)
    );
    expect(deniedBulk.message).toContain(tErrors.insufficientPermissions);

    // Even the CSV export contract's entry gate refuses the outsider.
    const deniedExportGate = await expectJourneyError(() =>
      requirePermission(outsider, AppPermission.ACCOUNTING_EXPENSES_VIEW, tErrors)
    );
    expect(deniedExportGate.message).toContain(tErrors.insufficientPermissions);

    const outsiderAuditRows = await db.select().from(auditLogs).where(eq(auditLogs.actorUserId, outsider));
    expect(outsiderAuditRows).toHaveLength(0);
  });

  test("step 9 — the full journey dispatches no notifications to anyone", async () => {
    // Dispatches would be fire-and-forget after the write commit, so drain a
    // small window before asserting the spy stayed silent.
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(dispatchSpy.mock.calls).toHaveLength(0);
  });
});
