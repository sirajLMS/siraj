import { randomUUID } from "node:crypto";
import type { db } from "@/backend/db";
import {
  classCategories,
  classInstances,
  classMeetingConfigs,
  classSubjects,
  creditTransactions,
  lessonReports,
  meetingProviders,
  parents,
  permissions,
  students,
  teacherAssignments,
  teacherDues,
  teachers,
  userMeetingConfigs,
  users,
} from "@/backend/db/schema";
import { generateTestPassword } from "@/backend/db/test/test-utils";
import {
  AccountStatus,
  type AppPermission,
  AttendanceEvaluation,
  CreditReason,
  LessonReportStatus,
  TeacherDueStatus,
} from "@/backend/enum";
import type {
  ClassInstanceSelectType,
  ClassMeetingConfigSelectType,
  CreditTransactionSelectType,
  DBTransaction,
  LessonReportSelectType,
  MeetingProviderSelectType,
  ParentSelectType,
  StudentSelectType,
  TeacherDueSelectType,
  TeacherSelectType,
  UserMeetingConfigSelectType,
  UserSelectType,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

/** LocalizedString helper for permission/group JSONB columns in tests. */
export function loc(en: string, ar?: string): { ar: string; en: string } {
  return { ar: ar ?? en, en };
}

/** DB client or transaction — both support the query methods used by test helpers. */
export type TestDb = DBTransaction | typeof db;

export async function ensureTestSubjectId(tx: TestDb): Promise<string> {
  const [existing] = await tx.select({ id: classSubjects.id }).from(classSubjects).limit(1);
  if (existing) {
    return existing.id;
  }

  const [category] = await tx
    .insert(classCategories)
    .values({
      name: "Test Category",
      slug: `test-cat-${randomUUID().slice(0, 8)}`,
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: classCategories.id });

  if (!category) {
    throw new Error("Failed to create test class category");
  }

  const [subject] = await tx
    .insert(classSubjects)
    .values({
      categoryId: category.id,
      name: "Test Subject",
      slug: `test-subj-${randomUUID().slice(0, 8)}`,
      isActive: true,
      sortOrder: 0,
    })
    .returning({ id: classSubjects.id });

  if (!subject) {
    throw new Error("Failed to create test class subject");
  }

  return subject.id;
}

export async function createTestUser(
  tx: TestDb,
  overrides: Partial<typeof users.$inferInsert> = {}
): Promise<UserSelectType> {
  const now = new Date();
  const [user] = await tx
    .insert(users)
    .values({
      name: "Test User",
      email: `test-${randomUUID()}@example.com`,
      password: generateTestPassword(),
      timezone: IanaTimezone.UTC,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();
  return user;
}

export async function createTestPermission(
  tx: TestDb,
  key: AppPermission,
  overrides: Partial<typeof permissions.$inferInsert> = {}
): Promise<typeof permissions.$inferSelect> {
  const [perm] = await tx
    .insert(permissions)
    .values({
      key,
      resource: "test",
      action: "test_action",
      description: loc("Test permission"),
      category: loc("Test"),
      isSystem: false,
      ...overrides,
    })
    .returning();
  return perm;
}

export async function createTestTeacher(
  tx: TestDb,
  userId: string,
  overrides: Partial<typeof teachers.$inferInsert> = {}
): Promise<TeacherSelectType> {
  const now = new Date();
  const [teacher] = await tx
    .insert(teachers)
    .values({
      userId,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();
  return teacher;
}

export async function createTestParent(
  tx: TestDb,
  userId: string,
  overrides: Partial<typeof parents.$inferInsert> = {}
): Promise<ParentSelectType> {
  const now = new Date();
  const [parent] = await tx
    .insert(parents)
    .values({
      userId,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();
  return parent;
}

export async function createTestStudent(
  tx: TestDb,
  parentId: string,
  overrides: Partial<typeof students.$inferInsert> = {}
): Promise<StudentSelectType> {
  const now = new Date();
  // LMS — students.userId IS NOT NULL: every student must have a login account.
  // If the caller did not provide a userId (most tests don't need a specific user),
  // create a throwaway user row and link it to the new student.
  const { userId: overrideUserId, ...remainingOverrides } = overrides;
  let userId = overrideUserId;
  if (!userId) {
    const studentUser = await createTestUser(tx, {
      name: "Test Student User",
      email: `student-${randomUUID()}@example.com`,
    });
    userId = studentUser.id;
  }
  const [student] = await tx
    .insert(students)
    .values({
      parentId,
      userId,
      name: "Test Student",
      status: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...remainingOverrides,
    })
    .returning();
  return student;
}

type TeacherSetupOverrides = Partial<typeof teachers.$inferInsert> & {
  status?: Exclude<(typeof users.$inferInsert)["status"], undefined>;
};

export async function setupTeacher(
  tx: TestDb,
  userOverrides: Partial<typeof users.$inferInsert> = {},
  teacherOverrides: TeacherSetupOverrides = {}
): Promise<{ user: UserSelectType; teacher: TeacherSelectType }> {
  const { status: accountStatus, ...teacherOnly } = teacherOverrides;
  const user = await createTestUser(tx, {
    ...userOverrides,
    status: userOverrides.status ?? accountStatus ?? AccountStatus.ACTIVATED,
  });
  const teacher = await createTestTeacher(tx, user.id, teacherOnly);
  return { user, teacher };
}

export async function setupStudent(
  tx: TestDb,
  userOverrides: Partial<typeof users.$inferInsert> = {},
  parentOverrides: Partial<typeof parents.$inferInsert> = {},
  studentOverrides: Partial<typeof students.$inferInsert> = {}
): Promise<{ user: UserSelectType; parent: ParentSelectType; student: StudentSelectType }> {
  const user = await createTestUser(tx, userOverrides);
  const parent = await createTestParent(tx, user.id, parentOverrides);
  const student = await createTestStudent(tx, parent.id, studentOverrides);
  return { user, parent, student };
}

export async function createMockClassInstance(
  tx: TestDb,
  studentId: string,
  teacherId: string,
  overrides: Partial<typeof classInstances.$inferInsert> = {}
): Promise<ClassInstanceSelectType> {
  const now = new Date();
  const subjectId = overrides.subjectId ?? (await ensureTestSubjectId(tx));
  const [instance] = await tx
    .insert(classInstances)
    .values({
      studentId,
      teacherId,
      scheduledStartAt: new Date(now.getTime() + 1000 * 60 * 60),
      scheduledEndAt: new Date(now.getTime() + 1000 * 60 * 120),
      durationMinutes: 60,
      classType: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...overrides,
      subjectId,
    })
    .returning();

  if (!instance) {
    throw new Error("Failed to create mock class instance");
  }

  return instance;
}

export async function setupTestEntities(
  tx: TestDb,
  prefix: string,
  options: { skipInstance?: boolean; classesRemaining?: number } = {}
): Promise<{
  parentUser: UserSelectType;
  parent: ParentSelectType;
  student: StudentSelectType;
  teacherUser: UserSelectType;
  teacher: TeacherSelectType;
  assignment: typeof teacherAssignments.$inferSelect;
  instance: ClassInstanceSelectType | null;
  now: Date;
}> {
  const now = new Date();

  const {
    user: parentUser,
    parent,
    student,
  } = await setupStudent(
    tx,
    { name: `${prefix} ParentUser`, email: `${prefix}-par-${randomUUID().slice(0, 8)}@example.com` },
    {},
    {
      name: `${prefix} Student`,
      classesRemaining: options.classesRemaining ?? 10,
      classesTotal: options.classesRemaining ?? 10,
    }
  );

  const { user: teacherUser, teacher } = await setupTeacher(tx, {
    name: `${prefix} TeacherUser`,
    email: `${prefix}-tea-${randomUUID().slice(0, 8)}@example.com`,
  });

  const [assignment] = await tx
    .insert(teacherAssignments)
    .values({
      studentId: student.id,
      teacherId: teacher.id,
      assignedAt: now,
    })
    .returning();

  const instance = options.skipInstance ? null : await createMockClassInstance(tx, student.id, teacher.id);

  return { parentUser, parent, student, teacherUser, teacher, assignment, instance, now };
}

export async function createTestMeetingProvider(
  tx: TestDb,
  overrides: Partial<typeof meetingProviders.$inferInsert> = {}
): Promise<MeetingProviderSelectType> {
  const now = new Date();
  const slug = overrides.slug ?? `zoom-${randomUUID().slice(0, 8)}`;
  const [provider] = await tx
    .insert(meetingProviders)
    .values({
      slug,
      name: loc("Zoom"),
      description: loc("Zoom video conferencing"),
      urlAllowlist: ["zoom.us", "*.zoom.us"],
      urlExample: "https://zoom.us/j/123456789",
      fieldSchema: { requiresMeetingUrl: true, supportsPassword: true },
      providerKind: "manual",
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();

  if (!provider) {
    throw new Error("Failed to create test meeting provider");
  }

  return provider;
}

export async function createTestMeetingConfig(
  tx: TestDb,
  userId: string,
  providerId: string,
  overrides: Partial<typeof userMeetingConfigs.$inferInsert> = {}
): Promise<UserMeetingConfigSelectType> {
  const now = new Date();
  const [config] = await tx
    .insert(userMeetingConfigs)
    .values({
      userId,
      providerId,
      label: "Test Meeting Config",
      isDefault: false,
      details: { meetingUrl: "https://zoom.us/j/123456789" },
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();

  if (!config) {
    throw new Error("Failed to create test meeting config");
  }

  return config;
}

export async function createTestClassMeetingConfig(
  tx: TestDb,
  scope: { classInstanceId: string } | { recurringScheduleId: string },
  providerId: string,
  overrides: Partial<typeof classMeetingConfigs.$inferInsert> = {}
): Promise<ClassMeetingConfigSelectType> {
  const now = new Date();
  const [config] = await tx
    .insert(classMeetingConfigs)
    .values({
      classInstanceId: "classInstanceId" in scope ? scope.classInstanceId : null,
      recurringScheduleId: "recurringScheduleId" in scope ? scope.recurringScheduleId : null,
      providerId,
      label: "Test Class Meeting Config",
      isDefault: false,
      details: { meetingUrl: "https://zoom.us/j/class-override" },
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();

  if (!config) {
    throw new Error("Failed to create test class meeting config");
  }

  return config;
}

/**
 * Creates a credit_transaction row for testing.
 * @param tx Database transaction
 * @param studentId Student to credit/debit
 * @param creditedByUserId User who performed the credit/debit action (required — the column is NOT NULL)
 * @param overrides Optional field overrides (defaults: changeAmount=1, reason=PURCHASE)
 */
export async function createTestCreditTransaction(
  tx: TestDb,
  studentId: string,
  creditedByUserId: string,
  overrides: Partial<typeof creditTransactions.$inferInsert> = {}
): Promise<CreditTransactionSelectType> {
  const now = new Date();
  const [row] = await tx
    .insert(creditTransactions)
    .values({
      studentId,
      changeAmount: 1,
      reason: CreditReason.PURCHASE,
      sourcePaymentId: null,
      classInstanceId: null,
      notes: null,
      creditedByUserId,
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create test credit transaction");
  }

  return row;
}

/**
 * Creates a lesson_report row for testing.
 * @param tx Database transaction
 * @param classInstanceId Class instance the report is for
 * @param studentId Student who attended the lesson
 * @param teacherId Teacher who taught the lesson
 * @param submittedByUserId User who submitted the report
 * @param overrides Optional field overrides (defaults: status=PENDING_REVIEW, durationMinutes=60,
 *  attendanceEvaluation=PRESENT, completionPercentage=100, lessonDate=now)
 */
export async function createTestLessonReport(
  tx: TestDb,
  classInstanceId: string,
  studentId: string,
  teacherId: string,
  submittedByUserId: string,
  overrides: Partial<typeof lessonReports.$inferInsert> = {}
): Promise<LessonReportSelectType> {
  const now = new Date();
  const [row] = await tx
    .insert(lessonReports)
    .values({
      classInstanceId,
      studentId,
      teacherId,
      lessonDate: now,
      durationMinutes: 60,
      attendanceEvaluation: AttendanceEvaluation.PRESENT,
      teacherNotes: null,
      completionPercentage: 100,
      status: LessonReportStatus.PENDING_REVIEW,
      submittedByUserId,
      submittedAt: now,
      reviewedByUserId: null,
      reviewedAt: null,
      rejectionReason: null,
      idempotencyKey: overrides.idempotencyKey ?? `lesson-report:${classInstanceId}`,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create test lesson report");
  }

  return row;
}

/**
 * Creates a teacher_due row for testing.
 * @param tx Database transaction
 * @param teacherId Teacher who accrued the due
 * @param classInstanceId Class instance the due is for
 * @param studentId Student who attended
 * @param approvedByUserId User who approved the lesson report
 * @param overrides Optional field overrides (defaults: status=PENDING, hours="1.00", amount="25.00",
 *  currency=SAR, approvedAt=now)
 */
export async function createTestTeacherDue(
  tx: TestDb,
  teacherId: string,
  classInstanceId: string,
  studentId: string,
  approvedByUserId: string,
  overrides: Partial<typeof teacherDues.$inferInsert> = {}
): Promise<TeacherDueSelectType> {
  const now = new Date();
  const [row] = await tx
    .insert(teacherDues)
    .values({
      teacherId,
      classInstanceId,
      studentId,
      hours: "1.00",
      amount: "25.00",
      currency: CurrencyCode.SAR,
      status: TeacherDueStatus.PENDING,
      approvedByUserId,
      approvedAt: now,
      teacherPaymentId: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create test teacher due");
  }

  return row;
}

/**
 * Creates a class instance in the COMPLETED execution state for testing
 * lesson-report workflows. Wraps `createMockClassInstance` and forces
 * `executionState = "COMPLETED"` plus a `TAKEN`/`PENDING` outcome pair that
 * satisfies the scheduling CHECK constraints.
 * @param tx Database transaction
 * @param studentId Student who attended
 * @param teacherId Teacher who taught
 * @param overrides Optional field overrides
 */
export async function createCompletedClassInstance(
  tx: TestDb,
  studentId: string,
  teacherId: string,
  overrides: Partial<typeof classInstances.$inferInsert> = {}
): Promise<ClassInstanceSelectType> {
  return createMockClassInstance(tx, studentId, teacherId, {
    executionState: ClassExecutionState.COMPLETED,
    outcome: ClassOutcome.TAKEN,
    actualStartAt: new Date(),
    actualEndAt: new Date(Date.now() + 60 * 1000),
    ...overrides,
  });
}
