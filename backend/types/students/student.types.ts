import type { students } from "@/backend/db/schema";
import type { AppLanguage, Gender, OrderSortDirection, StudentStatus } from "@/backend/enum";
import type { PageInfo } from "@/backend/types/shared/pagination.types";

export type StudentEntity = typeof students.$inferSelect;
export type StudentEntityInput = typeof students.$inferInsert;

export type Student = Omit<
  StudentEntity,
  // enums
  "status" | "gender" | "language" | "hoursPerWeek"
> & {
  gender: Gender | null;
  language: AppLanguage | null;
  status: StudentStatus;

  // resolved
  email?: string | null;
  parentName?: string | null;
  teacherName?: string | null;
  avatarUrl?: string | null;
  hoursPerWeek?: number | null;
};

export type StudentDirectory = Omit<
  Student,
  | "dateOfBirth"
  | "parentId"
  | " primaryTeacherId"
  | "idempotencyKey"
  | "version"
  | "language"
  | "timezoneOverride"
  | "gender"
>;

export interface StudentDirectoryResult {
  readonly id?: string;
  readonly rows: StudentDirectory[];
  readonly totalCount: number;
  readonly pageInfo?: PageInfo | null;
}

export type StudentCreateInput = Omit<
  StudentEntityInput,
  // enums
  | "status"
  | "gender"
  | "language"
  // forbidden
  | "id"
  | "createdAt"
  | "updatedAt"
> & {
  gender?: Gender | null;
  language?: AppLanguage | null;
  status: StudentStatus;
};

export interface StudentOnboardingInput {
  readonly parentId?: string | null;
  readonly name: string;
  readonly dateOfBirth?: Date | null;
  readonly gender?: Gender | null;
  readonly language?: AppLanguage | null;
  readonly primaryTeacherId?: string | null;
  readonly status?: StudentStatus | null;
  readonly classesTotal?: number | null;
  readonly classesRemaining?: number | null;
  // LMS — optional login account provisioning (email + password creates a users row,
  // links the resulting users.id to students.userId, and assigns STUDENT_DEFAULT group)
  readonly email?: string | null;
  readonly password?: string | null;
  readonly timezone?: string | null;
  readonly timezoneOverride?: string | null;
  readonly avatarUrl?: string | null;
  readonly phone?: string | null;
  readonly displayCurrency?: string | null;
}

export interface StudentOnboardingResult {
  readonly studentId: string;
  readonly parentId?: string | null;
  readonly userId?: string;
  readonly name: string;
  readonly status: StudentStatus;
  readonly primaryTeacherId: string | null;
}

export type PartialStudentUpdateInput = Partial<Omit<StudentCreateInput, "idempotencyKey">> & {
  id: string;
};

export type StudentsWithFiltersResponse = {
  data: Student[];
  pageInfo: PageInfo;
};

export type StudentFilterArgs = {
  name: string | null | undefined;
  nameNotContains: string | null | undefined;
  nameEquals: string | null | undefined;
  nameNotEquals: string | null | undefined;
  nameStartsWith: string | null | undefined;
  nameEndsWith: string | null | undefined;
  nameIsEmpty: boolean | null | undefined;
  nameIsNotEmpty: boolean | null | undefined;

  parentId: string | null | undefined;
  primaryTeacherId: string | null | undefined;
  gender: Gender | null | undefined;
  language: AppLanguage | null | undefined;
  status: StudentStatus | null | undefined;

  createdAt: Date | null | undefined;
  createdAtNot: Date | null | undefined;
  createdAtFrom: Date | null | undefined;
  createdAtTo: Date | null | undefined;
  createdAtAfter: Date | null | undefined;
  createdAtBefore: Date | null | undefined;
  createdAtOnOrAfter: Date | null | undefined;
  createdAtOnOrBefore: Date | null | undefined;
  createdAtIsEmpty: boolean | null | undefined;
  createdAtIsNotEmpty: boolean | null | undefined;

  birthDate: Date | null | undefined;
  birthDateNot: Date | null | undefined;
  birthDateFrom: Date | null | undefined;
  birthDateTo: Date | null | undefined;
  birthDateAfter: Date | null | undefined;
  birthDateBefore: Date | null | undefined;
  birthDateOnOrAfter: Date | null | undefined;
  birthDateOnOrBefore: Date | null | undefined;
  birthDateIsEmpty: boolean | null | undefined;
  birthDateIsNotEmpty: boolean | null | undefined;
};

export type StudentsOrderByClause = {
  column: StudentsOrderByColumn;
  order: OrderSortDirection | null | undefined;
};

export enum StudentsOrderByColumn {
  ID = "ID",
  NAME = "NAME",
  PARENT_ID = "PARENT_ID",
  DATE_OF_BIRTH = "DATE_OF_BIRTH",
  GENDER = "GENDER",
  STATUS = "STATUS",
  CLASSES_TOTAL = "CLASSES_TOTAL",
  CLASSES_REMAINING = "CLASSES_REMAINING",
  CREATED_AT = "CREATED_AT",
  UPDATED_AT = "UPDATED_AT",
}

export type StudentHistoryMetricsType = {
  totalClasses: number;
  attendanceRate: number;
  hoursStudied: number;
  performance: number;
};

export type StudentHistorySession = {
  id: string;
  title: string;
  time: string;
  duration: number;
  status: string;
  outcome?: string | null;
  isFrozen: boolean;
  instructor: string;
  timeSlot: string;
  room: string | null;
  notes: string;
  dayOfMonth: number;
  meetingJoinUrl?: string | null;
  effectiveMeeting?: import("@/backend/types/meeting/class-meeting-config.types").EffectiveMeetingReturnType | null;
};

export type StudentClassHistory = {
  id: string;
  studentName: string;
  metrics: StudentHistoryMetricsType;
  sessions: StudentHistorySession[];
};

export type StudentSessionDetail = {
  id: string;
  durationMinutes: number;
  executionState: string;
  outcome: string | null;
  remarks: string | null;
  meetingJoinUrl: string | null;
  effectiveMeeting?: import("@/backend/types/meeting/class-meeting-config.types").EffectiveMeetingReturnType | null;
  teacherName: string;
  scheduledStartAt: Date | string;
  scheduledEndAt: Date | string;
};
