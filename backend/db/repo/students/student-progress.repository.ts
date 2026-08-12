import { and, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { studentProgress } from "@/backend/db/schema/students/students";
import type { DBTransaction, StudentProgressInsertType, StudentProgressSelectType } from "@/backend/types";

export type StudentProgressUpsertInput = Pick<
  StudentProgressInsertType,
  | "studentId"
  | "classInstanceId"
  | "teacherId"
  | "topicsCovered"
  | "homeworkAssigned"
  | "notes"
  | "parentVisible"
  | "createdAt"
  | "updatedAt"
>;

export namespace StudentProgressRepository {
  export async function upsertMany(
    inputs: readonly StudentProgressUpsertInput[],
    tx?: DBTransaction
  ): Promise<StudentProgressSelectType[]> {
    if (inputs.length === 0) return [];
    const executor = tx ?? db;
    const results = await inputs.reduce(
      async (prev, input) => {
        const acc = await prev;
        const [row] = await executor
          .insert(studentProgress)
          .values(input)
          .onConflictDoUpdate({
            target: [studentProgress.studentId, studentProgress.classInstanceId],
            set: { updatedAt: input.updatedAt },
          })
          .returning();
        if (row) acc.push(row);
        return acc;
      },
      Promise.resolve([] as StudentProgressSelectType[])
    );
    return results;
  }

  export async function findByStudentClassPairs(
    pairs: readonly { studentId: string; classInstanceId: string }[],
    tx?: DBTransaction
  ): Promise<StudentProgressSelectType[]> {
    if (pairs.length === 0) return [];
    const q = queryDb(tx);
    const studentIds = [...new Set(pairs.map(p => p.studentId))];
    const classInstanceIds = [...new Set(pairs.map(p => p.classInstanceId))];
    const rows = await q
      .select()
      .from(studentProgress)
      .where(
        and(inArray(studentProgress.studentId, studentIds), inArray(studentProgress.classInstanceId, classInstanceIds))
      );
    const pairSet = new Set(pairs.map(p => `${p.studentId}:${p.classInstanceId}`));
    return rows.filter(r => pairSet.has(`${r.studentId}:${r.classInstanceId}`));
  }
}
