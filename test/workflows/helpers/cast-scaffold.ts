import { eq, inArray } from "drizzle-orm";
import {
  classCategories,
  classInstances,
  classStatusEvents,
  classSubjects,
  creditTransactions,
  lessonReports,
  parents,
  students,
  teacherDues,
  teachers,
  users,
} from "@/backend/db/schema";
import type { TestDb } from "@/backend/db/test/entity-setup";
import { revokeSystemGroupAssignments, type SystemGroupAssignment } from "@/test/workflows/helpers/permissions";

export interface CastSubjectPair {
  categoryId: string;
  subjectId: string;
}

/**
 * Creates a run-prefixed class category + subject (no hourly rate, so the rate
 * cascade deterministically falls through to the teacher tier) and returns both
 * ids for the cast cleanup tracker.
 */
export async function createCastSubjectPair(tx: TestDb, prefix: string): Promise<CastSubjectPair> {
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

  return { categoryId: category.id, subjectId: subject.id };
}

export interface CastFixturePurge {
  /** Class instance ids owned by the cast (side-effect rows hang off these with RESTRICT FKs). */
  instanceIds: string[];
  studentId: string;
  parentId: string;
  teacherIds: string[];
  userIds: string[];
  groupAssignments: SystemGroupAssignment[];
  /** Null when the cast reused pre-existing rows instead of creating them. */
  createdSubjectId: string | null;
  createdCategoryId: string | null;
}

/**
 * Hard-deletes a cast in FK-safe order, INCLUDING side-effect rows the services
 * create during the journey (class status events, lesson reports, teacher dues,
 * credit ledger rows). System permission groups are untouched — only this run's
 * membership rows are revoked. Nullable subject/category ids guard rows the cast
 * never created.
 */
export async function purgeCastFixture(tx: TestDb, fixture: CastFixturePurge): Promise<void> {
  await tx.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, fixture.instanceIds));
  await tx.delete(lessonReports).where(inArray(lessonReports.classInstanceId, fixture.instanceIds));
  await tx.delete(teacherDues).where(inArray(teacherDues.classInstanceId, fixture.instanceIds));
  await tx.delete(creditTransactions).where(eq(creditTransactions.studentId, fixture.studentId));
  await revokeSystemGroupAssignments(tx, fixture.groupAssignments);
  await tx.delete(classInstances).where(inArray(classInstances.id, fixture.instanceIds));
  await tx.delete(students).where(eq(students.id, fixture.studentId));
  await tx.delete(parents).where(eq(parents.id, fixture.parentId));
  await tx.delete(teachers).where(inArray(teachers.id, fixture.teacherIds));
  await tx.delete(users).where(inArray(users.id, fixture.userIds));
  if (fixture.createdSubjectId) {
    await tx.delete(classSubjects).where(eq(classSubjects.id, fixture.createdSubjectId));
  }
  if (fixture.createdCategoryId) {
    await tx.delete(classCategories).where(eq(classCategories.id, fixture.createdCategoryId));
  }
}
