import type { students } from "@/backend/db/schema";
import type { AppLanguage, Gender, OrderSortDirection, StudentStatus } from "@/shared/lib/enum";
import type { PageInfo } from "./pagination.types";

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
  instructor: string;
  timeSlot: string;
  room: string | null;
  notes: string;
  dayOfMonth: number;
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
  zoomMeetingUrl: string | null;
  teacherName: string;
  scheduledStartAt: Date | string;
  scheduledEndAt: Date | string;
};
