import { desc, eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { bulkInsertOnConflictDoNothing } from "@/backend/db/repo/shared/bulk-upsert";
import {
  classCommunications,
  classInstances,
  groupClassEnrollments,
  groupClasses,
  parents,
  students,
  users,
} from "@/backend/db/schema";
import type {
  ClassCommunicationCreateInput,
  ClassCommunicationSelectType,
  GroupClassCreateInput,
  GroupClassEnrollmentCreateInput,
  GroupClassEnrollmentSelectType,
  GroupClassEnrollmentWithStudent,
  GroupClassSelectType,
} from "@/backend/types";

async function runInTransaction<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? fn(tx) : db.transaction(fn);
}

export namespace GroupClassRepository {
  export async function getByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<GroupClassSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(groupClasses).where(eq(groupClasses.classInstanceId, classInstanceId)).limit(1);

    return row ?? null;
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<GroupClassSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(groupClasses).where(eq(groupClasses.id, id)).limit(1);

    return row ?? null;
  }

  export async function create(input: GroupClassCreateInput, tx?: DBTransaction): Promise<GroupClassSelectType> {
    return runInTransaction(tx, async t => {
      const [created] = await t.insert(groupClasses).values(input).returning();
      return created;
    });
  }

  export async function getEnrollments(
    groupClassId: string,
    tx?: DBTransaction
  ): Promise<GroupClassEnrollmentWithStudent[]> {
    const q = queryDb(tx);
    const rows = await q
      .select({
        enrollment: groupClassEnrollments,
        studentName: students.name,
        studentAvatarUrl: students.avatarUrl,
      })
      .from(groupClassEnrollments)
      .innerJoin(students, eq(groupClassEnrollments.studentId, students.id))
      .where(eq(groupClassEnrollments.groupClassId, groupClassId));

    return rows.map(r =>
      Object.assign(r.enrollment, {
        studentName: r.studentName,
        studentAvatarUrl: r.studentAvatarUrl,
      })
    );
  }

  export async function createEnrollments(
    inputs: GroupClassEnrollmentCreateInput[],
    tx?: DBTransaction
  ): Promise<GroupClassEnrollmentSelectType[]> {
    if (inputs.length === 0) return [];
    return runInTransaction(tx, async t => t.insert(groupClassEnrollments).values(inputs).returning());
  }

  export async function getCommunications(
    groupClassId: string,
    tx?: DBTransaction
  ): Promise<ClassCommunicationSelectType[]> {
    const q = queryDb(tx);
    return q
      .select()
      .from(classCommunications)
      .where(eq(classCommunications.groupClassId, groupClassId))
      .orderBy(desc(classCommunications.createdAt));
  }

  export async function createCommunication(
    input: ClassCommunicationCreateInput,
    tx?: DBTransaction
  ): Promise<ClassCommunicationSelectType> {
    return runInTransaction(tx, async t => {
      const [created] = await t.insert(classCommunications).values(input).returning();
      return created;
    });
  }

  export async function updateAdminNote(
    classInstanceId: string,
    content: string,
    tx?: DBTransaction
  ): Promise<GroupClassSelectType | null> {
    return runInTransaction(tx, async t => {
      const [updated] = await t
        .update(classInstances)
        .set({ adminNotes: content, updatedAt: new Date() })
        .where(eq(classInstances.id, classInstanceId))
        .returning();

      if (!updated) return null;

      const [groupClass] = await t
        .select()
        .from(groupClasses)
        .where(eq(groupClasses.classInstanceId, classInstanceId))
        .limit(1);

      return groupClass ?? null;
    });
  }

  export async function getEnrollmentsWithStudentDetails(
    groupClassId: string,
    tx?: DBTransaction
  ): Promise<
    {
      id: string;
      groupClassId: string;
      studentId: string;
      studentIdNumber: string | null;
      attendanceStatus: string;
      studentName: string;
      studentAvatarUrl: string | null;
    }[]
  > {
    const q = queryDb(tx);
    const rows = await q
      .select({
        id: groupClassEnrollments.id,
        groupClassId: groupClassEnrollments.groupClassId,
        studentId: groupClassEnrollments.studentId,
        studentIdNumber: groupClassEnrollments.studentIdNumber,
        attendanceStatus: groupClassEnrollments.attendanceStatus,
        studentName: students.name,
        studentAvatarUrl: students.avatarUrl,
      })
      .from(groupClassEnrollments)
      .innerJoin(students, eq(groupClassEnrollments.studentId, students.id))
      .where(eq(groupClassEnrollments.groupClassId, groupClassId));

    return rows;
  }

  export async function getParentUserIdsForGroupClass(groupClassId: string, tx?: DBTransaction): Promise<string[]> {
    const q = queryDb(tx);
    const studentRows = await q
      .select({ parentId: students.parentId })
      .from(groupClassEnrollments)
      .innerJoin(students, eq(groupClassEnrollments.studentId, students.id))
      .where(eq(groupClassEnrollments.groupClassId, groupClassId));

    const parentIds = [...new Set(studentRows.map(r => r.parentId).filter((id): id is string => id != null))];

    if (parentIds.length === 0) return [];

    const parentRows = await q
      .select({ userId: parents.userId })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(inArray(parents.id, parentIds));

    return parentRows.map(r => r.userId).filter((id): id is string => id != null);
  }
  export async function listByClassInstanceIds(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<GroupClassSelectType[]> {
    if (classInstanceIds.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(groupClasses)
      .where(inArray(groupClasses.classInstanceId, [...classInstanceIds]));
  }

  export async function createMany(
    inputs: GroupClassCreateInput[],
    tx?: DBTransaction
  ): Promise<GroupClassSelectType[]> {
    if (inputs.length === 0) return [];
    return runInTransaction(tx, async t => t.insert(groupClasses).values(inputs).returning());
  }

  export async function findEnrollmentKeys(
    keys: readonly { groupClassId: string; studentId: string }[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    if (keys.length === 0) return new Set();
    const groupClassIds = [...new Set(keys.map(k => k.groupClassId))];
    const q = queryDb(tx);
    const rows = await q
      .select({
        groupClassId: groupClassEnrollments.groupClassId,
        studentId: groupClassEnrollments.studentId,
      })
      .from(groupClassEnrollments)
      .where(inArray(groupClassEnrollments.groupClassId, groupClassIds));
    const wanted = new Set(keys.map(k => k.groupClassId + ":" + k.studentId));
    return new Set(rows.map(r => r.groupClassId + ":" + r.studentId).filter(key => wanted.has(key)));
  }

  export async function findEnrollmentsByKeys(
    keys: readonly { groupClassId: string; studentId: string }[],
    tx?: DBTransaction
  ): Promise<Map<string, GroupClassEnrollmentSelectType>> {
    const map = new Map<string, GroupClassEnrollmentSelectType>();
    if (keys.length === 0) return map;

    const groupClassIds = [...new Set(keys.map(k => k.groupClassId))];
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(groupClassEnrollments)
      .where(inArray(groupClassEnrollments.groupClassId, groupClassIds));
    const wanted = new Set(keys.map(k => k.groupClassId + ":" + k.studentId));
    for (const row of rows) {
      const key = row.groupClassId + ":" + row.studentId;
      if (wanted.has(key)) {
        map.set(key, row);
      }
    }
    return map;
  }

  export async function createManyEnrollments(
    inputs: GroupClassEnrollmentCreateInput[],
    tx?: DBTransaction
  ): Promise<GroupClassEnrollmentSelectType[]> {
    if (inputs.length === 0) return [];

    return runInTransaction(tx, async t => {
      await bulkInsertOnConflictDoNothing(groupClassEnrollments, inputs, { tx: t });
      const keys = inputs.map(i => ({ groupClassId: i.groupClassId, studentId: i.studentId }));
      const rows = await t
        .select()
        .from(groupClassEnrollments)
        .where(
          inArray(
            groupClassEnrollments.groupClassId,
            keys.map(k => k.groupClassId)
          )
        );
      const wanted = new Set(keys.map(k => k.groupClassId + ":" + k.studentId));
      return rows.filter(r => wanted.has(r.groupClassId + ":" + r.studentId));
    });
  }

  export async function listGroupClassIdsWithCommunications(
    groupClassIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    if (groupClassIds.length === 0) return new Set();
    const q = queryDb(tx);
    const rows = await q
      .selectDistinct({ groupClassId: classCommunications.groupClassId })
      .from(classCommunications)
      .where(inArray(classCommunications.groupClassId, [...groupClassIds]));
    return new Set(rows.map(r => r.groupClassId));
  }

  export async function createManyCommunications(
    inputs: ClassCommunicationCreateInput[],
    tx?: DBTransaction
  ): Promise<ClassCommunicationSelectType[]> {
    if (inputs.length === 0) return [];
    return runInTransaction(tx, async t => t.insert(classCommunications).values(inputs).returning());
  }
}
