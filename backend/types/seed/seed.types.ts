import type { AccountStatus, StudentStatus } from "@/backend/enum";
import type { ParentStatus } from "@/backend/enum/parents/parent.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export type SeedTeacherProfileInput = {
  userId: string;
  timezone: string;
  status?: AccountStatus;
  hourlyRate?: string;
  rateCurrency?: CurrencyCode;
};

export type SeedParentProfileInput = {
  userId: string;
  timezone: string;
  status: ParentStatus;
};

/** Input for idempotent demo-user upsert during seeding or test setup. */
export type SeedDemoUserInput = {
  name: string;
  email: string;
  plainPassword: string;
  isSuperAdmin?: boolean;
  groupSlug: string;
};

export type SeedStudentInput = {
  readonly parentId: string;
  readonly userId: string;
  readonly primaryTeacherId: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly status: StudentStatus;
  readonly classesTotal: number;
  readonly classesRemaining: number;
  readonly timezoneOverride: string | null;
  readonly idempotencyKey: string;
};

/** GraphQL-facing result of the createTestEntities test-helper mutation. */
export type TestEntitiesReturnType = {
  studentUserEmail: string;
  studentUserId: string;
  studentId: string;
  studentName: string;
  parentUserEmail: string;
  parentUserId: string;
  parentId: string;
  parentName: string;
  teacherUserEmail: string;
  teacherUserId: string;
  teacherId: string;
  teacherName: string;
};

/** GraphQL-facing result of the createTestGroupClass test-helper mutation. */
export type TestGroupClassReturnType = {
  groupClassId: string;
};

/** GraphQL-facing result of the createTestSuperAdmin test-helper mutation. */
export type TestSuperAdminReturnType = {
  userId: string;
  email: string;
};
