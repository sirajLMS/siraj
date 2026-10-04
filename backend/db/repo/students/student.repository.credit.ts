import { eq, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { students } from "@/backend/db/schema";
import type { StudentStatus } from "@/backend/enum";
import { ConflictError } from "@/backend/lib/errors";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

async function acquireStudentLock(tx: DBTransaction, studentId: string): Promise<void> {
  await acquireAdvisoryLock(tx, `student_${studentId}`);
}

async function adjustStudentClassesQuota(
  t: DBTransaction,
  studentId: string,
  updateFn: (current: Types.StudentSelectType) => Record<string, unknown> | Promise<Record<string, unknown>>,
  tErrors: ErrorsLabels,
  expectedVersion?: number
): Promise<Types.StudentSelectType> {
  await acquireStudentLock(t, studentId);

  const results = await t.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (results.length === 0) {
    throw new Error(tErrors.studentNotFound(studentId));
  }
  const current = results[0];

  if (expectedVersion !== undefined && current.version !== expectedVersion) {
    throw new Error(tErrors.studentVersionMismatch({ id: studentId, expectedVersion, gotVersion: current.version }));
  }

  const [updated] = await t
    .update(students)
    .set({
      ...(await updateFn(current)),
      version: sql`${students.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  return updated;
}

function runStudentUpdate(
  studentId: string,
  updates: (current: Types.StudentSelectType) => Record<string, unknown>,
  tErrors: ErrorsLabels,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  const runner = async (t: DBTransaction) => adjustStudentClassesQuota(t, studentId, updates, tErrors, expectedVersion);
  return tx ? runner(tx) : db.transaction(runner);
}

function shiftStudentClasses(
  studentId: string,
  tErrors: ErrorsLabels,
  amount: number,
  direction: "add" | "deduct",
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return runStudentUpdate(
    studentId,
    () =>
      direction === "add"
        ? {
            classesRemaining: sql`${students.classesRemaining} + ${amount}`,
            classesTotal: sql`${students.classesTotal} + ${amount}`,
          }
        : { classesRemaining: sql`${students.classesRemaining} - ${amount}` },
    tErrors,
    expectedVersion,
    tx
  );
}

export function deductStudentClasses(
  studentId: string,
  tErrors: ErrorsLabels,
  amount: number = 1,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return shiftStudentClasses(studentId, tErrors, amount, "deduct", expectedVersion, tx);
}

export function addStudentClasses(
  studentId: string,
  tErrors: ErrorsLabels,
  amount: number = 1,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return shiftStudentClasses(studentId, tErrors, amount, "add", expectedVersion, tx);
}

export function setStudentClassesRemaining(
  studentId: string,
  newClassesRemaining: number,
  tErrors: ErrorsLabels,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return runStudentUpdate(studentId, () => ({ classesRemaining: newClassesRemaining }), tErrors, expectedVersion, tx);
}

export function reassignStudentTeacher(
  studentId: string,
  newTeacherId: string,
  tErrors: ErrorsLabels,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return runStudentUpdate(studentId, () => ({ primaryTeacherId: newTeacherId }), tErrors, expectedVersion, tx);
}

export function changeStudentStatus(
  studentId: string,
  newStatus: StudentStatus,
  tErrors: ErrorsLabels,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return runStudentUpdate(studentId, () => ({ status: newStatus }), tErrors, expectedVersion, tx);
}

// ─── Credit-hours parallel balance methods ────────────────────────────────
// Mirror of addStudentClasses/deductStudentClasses on the numeric(12,2)
// creditHours columns. adjustStudentClassesQuota already acquires
// acquireStudentLock inside the tx, so the insufficient-hours pre-check runs
// INSIDE the tx after the lock.

export function addStudentCreditHours(
  studentId: string,
  tErrors: ErrorsLabels,
  amount: number,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return runStudentUpdate(
    studentId,
    () => ({
      creditHoursRemaining: sql`${students.creditHoursRemaining} + ${amount}`,
      creditHoursTotal: sql`${students.creditHoursTotal} + ${amount}`,
    }),
    tErrors,
    expectedVersion,
    tx
  );
}

export function deductStudentCreditHours(
  studentId: string,
  tErrors: ErrorsLabels,
  amount: number,
  expectedVersion?: number,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  return runStudentUpdate(
    studentId,
    current => {
      const remaining = Number(current.creditHoursRemaining);
      if (remaining < amount) {
        throw new ConflictError(tErrors.credit.insufficientHours({ studentId, remaining, required: amount }));
      }
      return { creditHoursRemaining: sql`${students.creditHoursRemaining} - ${amount}` };
    },
    tErrors,
    expectedVersion,
    tx
  );
}
