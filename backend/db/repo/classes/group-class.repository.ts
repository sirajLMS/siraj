import { desc, eq, inArray } from "drizzle-orm";
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

async function insertReturning<T>(
  table: Parameters<typeof db.insert>[0],
  values: Record<string, unknown>,
  tx?: DBTransaction
): Promise<T> {
  const runner = async (t: DBTransaction) => {
    const [created] = await t.insert(table).values(values).returning();
    return created as T;
  };
  return tx ? runner(tx) : db.transaction(runner);
}

export namespace GroupClassRepository {
  export async function getByClassInstanceId(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<GroupClassSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
      .select()
      .from(groupClasses)
      .where(eq(groupClasses.classInstanceId, classInstanceId))
      .limit(1);

    return row ?? null;
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<GroupClassSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb.select().from(groupClasses).where(eq(groupClasses.id, id)).limit(1);

    return row ?? null;
  }

  export async function create(input: GroupClassCreateInput, tx?: DBTransaction): Promise<GroupClassSelectType> {
    return insertReturning<GroupClassSelectType>(groupClasses, { ...input }, tx);
  }

  export async function getEnrollments(
    groupClassId: string,
    tx?: DBTransaction
  ): Promise<GroupClassEnrollmentWithStudent[]> {
    const queryDb = tx ?? db;
    const rows = await queryDb
      .select({
        enrollment: groupClassEnrollments,
        studentName: students.name,
        studentAvatarUrl: students.avatarUrl,
      })
      .from(groupClassEnrollments)
      .innerJoin(students, eq(groupClassEnrollments.studentId, students.id))
      .where(eq(groupClassEnrollments.groupClassId, groupClassId));

    return rows.map(r => ({
      ...r.enrollment,
      studentName: r.studentName,
      studentAvatarUrl: r.studentAvatarUrl,
    }));
  }

  export async function createEnrollments(
    inputs: GroupClassEnrollmentCreateInput[],
    tx?: DBTransaction
  ): Promise<GroupClassEnrollmentSelectType[]> {
    if (inputs.length === 0) return [];

    const runner = async (t: DBTransaction) => {
      return t.insert(groupClassEnrollments).values(inputs).returning();
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

  export async function getCommunications(
    groupClassId: string,
    tx?: DBTransaction
  ): Promise<ClassCommunicationSelectType[]> {
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(classCommunications)
      .where(eq(classCommunications.groupClassId, groupClassId))
      .orderBy(desc(classCommunications.createdAt));
  }

  export async function createCommunication(
    input: ClassCommunicationCreateInput,
    tx?: DBTransaction
  ): Promise<ClassCommunicationSelectType> {
    return insertReturning<ClassCommunicationSelectType>(classCommunications, { ...input }, tx);
  }

  export async function updateAdminNote(
    classInstanceId: string,
    content: string,
    tx?: DBTransaction
  ): Promise<GroupClassSelectType | null> {
    const runner = async (t: DBTransaction) => {
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
    };

    return tx ? runner(tx) : db.transaction(runner);
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
    const queryDb = tx ?? db;
    const rows = await queryDb
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
    const queryDb = tx ?? db;
    const studentRows = await queryDb
      .select({ parentId: students.parentId })
      .from(groupClassEnrollments)
      .innerJoin(students, eq(groupClassEnrollments.studentId, students.id))
      .where(eq(groupClassEnrollments.groupClassId, groupClassId));

    const parentIds = [...new Set(studentRows.map(r => r.parentId).filter((id): id is string => id != null))];

    if (parentIds.length === 0) return [];

    const parentRows = await queryDb
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
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(groupClasses)
      .where(inArray(groupClasses.classInstanceId, [...classInstanceIds]));
  }

  export async function createMany(
    inputs: GroupClassCreateInput[],
    tx?: DBTransaction
  ): Promise<GroupClassSelectType[]> {
    if (inputs.length === 0) return [];
    const runner = async (t: DBTransaction) => t.insert(groupClasses).values(inputs).returning();
    return tx ? runner(tx) : db.transaction(runner);
  }

  export async function findEnrollmentKeys(
    keys: readonly { groupClassId: string; studentId: string }[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    if (keys.length === 0) return new Set();
    const groupClassIds = [...new Set(keys.map(k => k.groupClassId))];
    const queryDb = tx ?? db;
    const rows = await queryDb
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
    const queryDb = tx ?? db;
    const rows = await queryDb
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

    const runner = async (t: DBTransaction) => {
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
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

  export async function listGroupClassIdsWithCommunications(
    groupClassIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    if (groupClassIds.length === 0) return new Set();
    const queryDb = tx ?? db;
    const rows = await queryDb
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
    const runner = async (t: DBTransaction) => t.insert(classCommunications).values(inputs).returning();
    return tx ? runner(tx) : db.transaction(runner);
  }
}
