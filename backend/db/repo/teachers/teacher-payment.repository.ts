import { and, eq, inArray, or } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { teacherPayments } from "@/backend/db/schema";
import type { DBTransaction, TeacherPaymentInsertType, TeacherPaymentSelectType } from "@/backend/types";

function teacherPaymentKeyOf(
  teacherId: string | undefined | null,
  paymentDate: Date | string | undefined | null
): string {
  return `${teacherId ?? ""}|${paymentDate ? new Date(paymentDate).getTime() : 0}`;
}

export namespace TeacherPaymentRepository {
  export async function findByTeacherAndPaymentDates(
    teacherId: string,
    paymentDates: Date[],
    tx?: DBTransaction
  ): Promise<TeacherPaymentSelectType[]> {
    if (paymentDates.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(teacherPayments)
      .where(and(eq(teacherPayments.teacherId, teacherId), inArray(teacherPayments.paymentDate, paymentDates)));
  }

  export async function createManyIfMissing(
    inputs: readonly TeacherPaymentInsertType[],
    tx?: DBTransaction
  ): Promise<TeacherPaymentSelectType[]> {
    if (inputs.length === 0) return [];
    const validInputs = inputs.filter(
      (input): input is TeacherPaymentInsertType & { teacherId: string; paymentDate: Date | string } =>
        Boolean(input.teacherId && input.paymentDate)
    );
    if (validInputs.length === 0) return [];
    const executor = tx ?? db;

    // Batch existence check: a single query covering all (teacherId, paymentDate) pairs.
    const existingConditions = validInputs.map(input =>
      and(eq(teacherPayments.teacherId, input.teacherId), eq(teacherPayments.paymentDate, new Date(input.paymentDate)))
    );
    const existingRows = await executor
      .select()
      .from(teacherPayments)
      .where(or(...existingConditions));

    const existingByKey = new Map<string, TeacherPaymentSelectType>();
    for (const row of existingRows) {
      existingByKey.set(teacherPaymentKeyOf(row.teacherId, row.paymentDate), row);
    }

    // Determine which inputs still need to be inserted (deduplicated by composite key).
    const toInsert: TeacherPaymentInsertType[] = [];
    const seenKeys = new Set<string>();
    for (const input of validInputs) {
      const key = teacherPaymentKeyOf(input.teacherId, input.paymentDate);
      if (existingByKey.has(key) || seenKeys.has(key)) continue;
      toInsert.push(input);
      seenKeys.add(key);
    }

    // Batch insert all missing records in a single statement.
    const insertedByKey = new Map<string, TeacherPaymentSelectType>();
    if (toInsert.length > 0) {
      const insertedRows = await executor.insert(teacherPayments).values(toInsert).returning();
      for (const row of insertedRows) {
        insertedByKey.set(teacherPaymentKeyOf(row.teacherId, row.paymentDate), row);
      }
    }

    // Build results preserving the original input order (duplicates resolve to the same row).
    const results: TeacherPaymentSelectType[] = [];
    for (const input of inputs) {
      const key = teacherPaymentKeyOf(input.teacherId, input.paymentDate);
      const row = existingByKey.get(key) ?? insertedByKey.get(key);
      if (row) results.push(row);
    }
    return results;
  }
}
