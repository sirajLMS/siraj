import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  classCategories,
  classInstances,
  classSubjects,
  creditTransactions,
  lessonReports,
  parents,
  students,
  teacherDues,
  teachers,
  users,
} from "@/backend/db/schema";
import {
  createCompletedClassInstance,
  createTestParent,
  createTestStudent,
  createTestTeacher,
  createTestUser,
  type TestDb,
} from "@/backend/db/test/entity-setup";
import type {
  ClassInstanceSelectType,
  ParentSelectType,
  StudentSelectType,
  TeacherSelectType,
  UserSelectType,
} from "@/backend/types";
import { SystemPermissionGroupSlug } from "@/shared/constants";
import {
  assignSystemGroup,
  revokeSystemGroupAssignments,
  type SystemGroupAssignment,
} from "@/test/workflows/helpers/permissions";

/**
 * The actor "cast" for the lesson-report lifecycle journey. Every committed
 * row id created by `provisionLessonReportCast` is tracked here so
 * `cleanupLessonReportCast` can hard-delete the full fixture in `afterAll`.
 */
export interface LessonReportCast {
  prefix: string;
  /** Primary teacher — submits reports, holds lesson_reports.submit. */
  teacherUser: UserSelectType;
  teacher: TeacherSelectType;
  /** Second teacher (submit only) used for cross-actor negative checks. */
  secondTeacherUser: UserSelectType;
  secondTeacher: TeacherSelectType;
  /** Reviewer — holds lesson_reports.review/approve/reject. */
  managerUser: UserSelectType;
  parentUser: UserSelectType;
  parent: ParentSelectType;
  student: StudentSelectType;
  /** Two COMPLETED class instances owned by `teacher` for `student`. */
  firstClassInstance: ClassInstanceSelectType;
  secondClassInstance: ClassInstanceSelectType;
  groupAssignments: SystemGroupAssignment[];
  /** Category/subject created only when the DB had no subject at all. */
  createdCategoryId: string | null;
  createdSubjectId: string | null;
}

interface CastSubject {
  subjectId: string;
  createdCategoryId: string | null;
  createdSubjectId: string | null;
}

/**
 * Reuses an existing class subject when one exists; otherwise creates a
 * prefixed category + subject and tracks both for cleanup.
 */
async function ensureCastSubject(tx: TestDb, prefix: string): Promise<CastSubject> {
  const [existing] = await tx.select({ id: classSubjects.id }).from(classSubjects).limit(1);
  if (existing) {
    return { subjectId: existing.id, createdCategoryId: null, createdSubjectId: null };
  }

  const now = new Date();
  const [category] = await tx
    .insert(classCategories)
    .values({
      name: `${prefix} Category`,
      slug: `${prefix}-category`,
      isActive: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: classCategories.id });
  if (!category) {
    throw new Error("Workflow cast: failed to create class category");
  }

  const [subject] = await tx
    .insert(classSubjects)
    .values({
      categoryId: category.id,
      name: `${prefix} Subject`,
      slug: `${prefix}-subject`,
      isActive: true,
      sortOrder: 0,
    })
    .returning({ id: classSubjects.id });
  if (!subject) {
    throw new Error("Workflow cast: failed to create class subject");
  }

  return { subjectId: subject.id, createdCategoryId: category.id, createdSubjectId: subject.id };
}

/**
 * Provisions the full lesson-report cast in a single COMMITTING transaction:
 * teacher (+ submit), second teacher (+ submit), manager
 * (+ review/approve/reject via `supervisor_default`), parent, student, and two
 * COMPLETED class instances owned by the primary teacher for that student.
 * All rows are tracked on the returned cast for `afterAll` cleanup.
 */
export async function provisionLessonReportCast(prefix: string): Promise<LessonReportCast> {
  return db.transaction(async tx => {
    const subject = await ensureCastSubject(tx, prefix);

    const teacherUser = await createTestUser(tx, { name: `${prefix} Teacher` });
    const secondTeacherUser = await createTestUser(tx, { name: `${prefix} Teacher B` });
    const managerUser = await createTestUser(tx, { name: `${prefix} Manager` });
    const parentUser = await createTestUser(tx, { name: `${prefix} Parent` });

    const teacher = await createTestTeacher(tx, teacherUser.id);
    const secondTeacher = await createTestTeacher(tx, secondTeacherUser.id);
    const parent = await createTestParent(tx, parentUser.id);
    const student = await createTestStudent(tx, parent.id, { name: `${prefix} Student` });

    const firstClassInstance = await createCompletedClassInstance(tx, student.id, teacher.id, {
      subjectId: subject.subjectId,
    });
    const secondClassInstance = await createCompletedClassInstance(tx, student.id, teacher.id, {
      subjectId: subject.subjectId,
    });

    const groupAssignments = [
      await assignSystemGroup(tx, teacherUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
      await assignSystemGroup(tx, secondTeacherUser.id, SystemPermissionGroupSlug.TEACHER_DEFAULT),
      await assignSystemGroup(tx, managerUser.id, SystemPermissionGroupSlug.SUPERVISOR_DEFAULT),
    ];

    return {
      prefix,
      teacherUser,
      teacher,
      secondTeacherUser,
      secondTeacher,
      managerUser,
      parentUser,
      parent,
      student,
      firstClassInstance,
      secondClassInstance,
      groupAssignments,
      createdCategoryId: subject.createdCategoryId,
      createdSubjectId: subject.createdSubjectId,
    };
  });
}

/**
 * Hard-deletes the full cast in FK-safe order, INCLUDING side-effect rows the
 * services create during the journey (lesson reports, teacher dues, credit
 * refund ledger rows). System permission groups themselves are untouched —
 * only this run's membership rows are removed.
 */
export async function cleanupLessonReportCast(cast: LessonReportCast): Promise<void> {
  const instanceIds = [cast.firstClassInstance.id, cast.secondClassInstance.id];
  const teacherIds = [cast.teacher.id, cast.secondTeacher.id];
  const userIds = [
    cast.teacherUser.id,
    cast.secondTeacherUser.id,
    cast.managerUser.id,
    cast.parentUser.id,
    cast.student.userId,
  ];

  await db.transaction(async tx => {
    await tx.delete(lessonReports).where(inArray(lessonReports.classInstanceId, instanceIds));
    await tx.delete(teacherDues).where(inArray(teacherDues.classInstanceId, instanceIds));
    await tx.delete(creditTransactions).where(eq(creditTransactions.studentId, cast.student.id));
    await revokeSystemGroupAssignments(tx, cast.groupAssignments);
    await tx.delete(classInstances).where(inArray(classInstances.id, instanceIds));
    await tx.delete(students).where(eq(students.id, cast.student.id));
    await tx.delete(parents).where(eq(parents.id, cast.parent.id));
    await tx.delete(teachers).where(inArray(teachers.id, teacherIds));
    await tx.delete(users).where(inArray(users.id, userIds));
    if (cast.createdSubjectId) {
      await tx.delete(classSubjects).where(eq(classSubjects.id, cast.createdSubjectId));
    }
    if (cast.createdCategoryId) {
      await tx.delete(classCategories).where(eq(classCategories.id, cast.createdCategoryId));
    }
  });
}
