import { and, eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { teacherPayments } from "@/backend/db/schema/teachers/teacher-payments";
import type { TeacherPaymentInsertType, TeacherPaymentSelectType } from "@/backend/types";

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
    const executor = tx ?? db;
    const results: TeacherPaymentSelectType[] = [];

    for (const input of inputs) {
      const [existing] = await executor
        .select()
        .from(teacherPayments)
        .where(and(eq(teacherPayments.teacherId, input.teacherId), eq(teacherPayments.paymentDate, input.paymentDate)))
        .limit(1);
      if (existing) {
        results.push(existing);
        continue;
      }
      const [row] = await executor.insert(teacherPayments).values(input).returning();
      if (row) results.push(row);
    }
    return results;
  }
}
