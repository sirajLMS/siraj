import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { CarryoverHandoffPayload } from "@/backend/services/billing/carryover-handoff";
import type { DBTransaction } from "@/backend/types";

// ---------------------------------------------------------------------------
// Dialect mock — the handoff is a deliberate no-op on SQLite.
// ---------------------------------------------------------------------------

let sqliteMode = false;

const realDialect = await import("@/backend/db/dialect");

await mock.module("@/backend/db/dialect", () => ({
  ...realDialect,
  isSqlite: () => sqliteMode,
}));

const { maybeInsertCarryoverBalanceEntry } = await import("@/backend/services/billing/carryover-handoff");

const pgDialect = new PgDialect();

const CREDIT_TRANSACTION_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const TEACHER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const STUDENT_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const APPROVER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const CARRYOVER_TABLE = "teacher_carryover_balances";

function buildPayload(overrides: Partial<CarryoverHandoffPayload> = {}): CarryoverHandoffPayload {
  return {
    creditTransactionId: CREDIT_TRANSACTION_ID,
    teacherId: TEACHER_ID,
    studentId: STUDENT_ID,
    fromDate: "2026-08-01",
    toDate: "2026-08-14",
    paymentDate: "2026-08-15",
    hours: 2,
    approvedByUserId: APPROVER_ID,
    ...overrides,
  };
}

function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null;
}

function asDbTx(value: unknown): DBTransaction {
  if (isDbTransaction(value)) return value;
  throw new Error("fake tx must be an object");
}

/** Fake transaction whose `execute` records every query and replays canned results. */
function buildRecordingTx(results: unknown[] = []): { executed: SQL[]; tx: DBTransaction } {
  const executed: SQL[] = [];
  const queued = [...results];
  const executor = {
    execute: async (query: SQL): Promise<unknown> => {
      executed.push(query);
      return queued.shift();
    },
  };
  return { executed, tx: asDbTx(executor) };
}

function renderProbe(insertQuery: SQL): { sql: string; params: unknown[] } {
  return pgDialect.sqlToQuery(insertQuery);
}

describe("maybeInsertCarryoverBalanceEntry — skip branches", () => {
  beforeEach(() => {
    sqliteMode = false;
  });

  test("no-ops on SQLite without touching the database", async () => {
    sqliteMode = true;
    const { executed, tx } = buildRecordingTx();

    await maybeInsertCarryoverBalanceEntry(tx, buildPayload());

    expect(executed).toHaveLength(0);
  });

  test("no-ops when the transaction cannot execute raw SQL", async () => {
    const result = await maybeInsertCarryoverBalanceEntry(asDbTx({}), buildPayload());

    expect(result).toBeUndefined();
  });

  test("no-ops when the carryover payouts table does not exist", async () => {
    const { executed, tx } = buildRecordingTx([{ rows: [{ name: null }] }]);

    await maybeInsertCarryoverBalanceEntry(tx, buildPayload());

    expect(executed).toHaveLength(1);
  });

  test("treats an empty probe result set as a missing table", async () => {
    const { executed, tx } = buildRecordingTx([{ rows: [] }]);

    await maybeInsertCarryoverBalanceEntry(tx, buildPayload());

    expect(executed).toHaveLength(1);
  });

  test("treats a non-record probe result as a missing table", async () => {
    const { executed, tx } = buildRecordingTx(["unexpected driver payload"]);

    await maybeInsertCarryoverBalanceEntry(tx, buildPayload());

    expect(executed).toHaveLength(1);
  });
});

describe("maybeInsertCarryoverBalanceEntry — insert branch", () => {
  beforeEach(() => {
    sqliteMode = false;
  });

  test("inserts a parameterized PENDING entry when the table exists ({ rows } driver shape)", async () => {
    const payload = buildPayload();
    const { executed, tx } = buildRecordingTx([{ rows: [{ name: CARRYOVER_TABLE }] }]);

    await maybeInsertCarryoverBalanceEntry(tx, payload);

    expect(executed).toHaveLength(2);
    const rendered = renderProbe(executed[1] ?? executed[0]);
    expect(rendered.sql).toContain(`INSERT INTO "${CARRYOVER_TABLE}"`);
    expect(rendered.sql).toContain("'PENDING'");
    expect(rendered.sql).toContain("now()");
    expect(rendered.params).toEqual([
      payload.creditTransactionId,
      payload.teacherId,
      payload.studentId,
      payload.fromDate,
      payload.toDate,
      payload.paymentDate,
      payload.hours,
    ]);
  });

  test("accepts the plain-array probe result shape (Neon HTTP driver)", async () => {
    const { executed, tx } = buildRecordingTx([[{ name: CARRYOVER_TABLE }]]);

    await maybeInsertCarryoverBalanceEntry(tx, buildPayload());

    expect(executed).toHaveLength(2);
  });

  test("ignores non-record probe rows when filtering the result set", async () => {
    const { executed, tx } = buildRecordingTx([{ rows: [null, "noise", { name: CARRYOVER_TABLE }] }]);

    await maybeInsertCarryoverBalanceEntry(tx, buildPayload());

    expect(executed).toHaveLength(2);
  });
});

describe("maybeInsertCarryoverBalanceEntry — injection safety", () => {
  test("binds hostile payload values as parameters, never interpolated into SQL text", async () => {
    const hostileId = "x'; DROP TABLE teacher_carryover_balances; --";
    const hostileDate = "2026-08-01'); DELETE FROM users; --";
    const payload = buildPayload({ teacherId: hostileId, fromDate: hostileDate });
    const { executed, tx } = buildRecordingTx([{ rows: [{ name: CARRYOVER_TABLE }] }]);

    await maybeInsertCarryoverBalanceEntry(tx, payload);

    expect(executed).toHaveLength(2);
    const rendered = renderProbe(executed[1] ?? executed[0]);
    expect(rendered.sql).not.toContain("DROP TABLE");
    expect(rendered.sql).not.toContain("DELETE FROM");
    expect(rendered.params).toContain(hostileId);
    expect(rendered.params).toContain(hostileDate);
  });
});
