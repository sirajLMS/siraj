import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { siteContent, students, teachers, users } from "@/backend/db/schema";
import { StudentStatus } from "@/backend/enum";
import type { DBTransaction, StudentProgressReturnType, WorkshopPromoReturnType } from "@/backend/types";
import { parseStudentStatus } from "@/shared/lib/enum";

type AssociatedStudentRow = {
  id: string;
  name: string;
  studentAvatarUrl: string | null;
  status: StudentStatus;
  primaryTeacherId: string | null;
  teacherUserId: string | null;
  teacherName: string | null;
  teacherAvatarUrl: string | null;
  hoursPerWeek: string;
  classesRemaining: number;
  classesTotal: number;
  language: string | null;
  gender: string | null;
  version: number;
  updatedAt: Date;
};

const getAssociatedStudentsBaseQuery = (executor: typeof db | DBTransaction) => {
  return executor
    .select({
      id: students.id,
      name: students.name,
      studentAvatarUrl: students.avatarUrl,
      status: students.status,
      primaryTeacherId: students.primaryTeacherId,
      teacherUserId: teachers.userId,
      teacherName: users.name,
      teacherAvatarUrl: users.avatarUrl,
      hoursPerWeek: students.hoursPerWeek,
      classesRemaining: students.classesRemaining,
      classesTotal: students.classesTotal,
      language: students.language,
      gender: students.gender,
      version: students.version,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id));
};

const mapAssociatedStudentRow = (r: {
  id: string;
  name: string;
  studentAvatarUrl: string | null;
  status: string;
  primaryTeacherId: string | null;
  teacherUserId: string | null;
  teacherName: string | null;
  teacherAvatarUrl: string | null;
  hoursPerWeek: string;
  classesRemaining: number;
  classesTotal: number;
  language: string | null;
  gender: string | null;
  version: number;
  updatedAt: Date;
}): AssociatedStudentRow => ({
  id: r.id,
  name: r.name,
  studentAvatarUrl: r.studentAvatarUrl,
  status: parseStudentStatus(r.status) ?? StudentStatus.REGULAR,
  primaryTeacherId: r.primaryTeacherId,
  teacherUserId: r.teacherUserId,
  teacherName: r.teacherName ?? null,
  teacherAvatarUrl: r.teacherAvatarUrl,
  hoursPerWeek: r.hoursPerWeek,
  classesRemaining: r.classesRemaining,
  classesTotal: r.classesTotal,
  language: r.language ?? null,
  gender: r.gender ?? null,
  version: r.version,
  updatedAt: r.updatedAt,
});

export const getAssociatedStudentsImpl = async (
  parentId: string,
  tx?: DBTransaction
): Promise<AssociatedStudentRow[]> => {
  const executor = tx ?? db;

  const results = await getAssociatedStudentsBaseQuery(executor)
    .where(eq(students.parentId, parentId))
    .orderBy(students.name);

  return results.map(mapAssociatedStudentRow);
};

export const getAssociatedStudentByIdImpl = async (
  studentId: string,
  tx?: DBTransaction
): Promise<AssociatedStudentRow | null> => {
  const executor = tx ?? db;

  const results = await getAssociatedStudentsBaseQuery(executor).where(eq(students.id, studentId)).limit(1);

  if (results.length === 0) {
    return null;
  }

  return mapAssociatedStudentRow(results[0]);
};

export const getParentStudentProgressImpl = async (
  parentId: string,
  tx?: DBTransaction
): Promise<StudentProgressReturnType[]> => {
  const executor = tx ?? db;

  const parentStudents = await executor
    .select({
      id: students.id,
      name: students.name,
      classesTotal: students.classesTotal,
      classesRemaining: students.classesRemaining,
    })
    .from(students)
    .where(eq(students.parentId, parentId));

  return parentStudents.map(s => ({
    id: s.id,
    name: s.name,
    completionPercent:
      s.classesTotal > 0 ? Math.round(((s.classesTotal - s.classesRemaining) / s.classesTotal) * 100) : 0,
  }));
};

export const getParentWorkshopPromoImpl = async (
  _parentId: string,
  tx?: DBTransaction
): Promise<WorkshopPromoReturnType | null> => {
  const executor = tx ?? db;

  const rows = await executor
    .select({
      id: siteContent.id,
      title: siteContent.title,
      body: siteContent.body,
    })
    .from(siteContent)
    .where(and(eq(siteContent.contentType, "workshop_promo"), eq(siteContent.isPublished, true)))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.body,
    imageUrl: "",
  };
};
