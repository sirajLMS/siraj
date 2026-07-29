import type { AppLanguage, CurrencyCode, Gender, StudentStatus } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { StudentClassHistory } from "@/backend/types/students/student.types";
import type { StudentUpcomingClassesResult } from "@/backend/types/students/student-status.types";

export type StudentProfileReturnType = {
  readonly id: string;
  readonly name: string;
  readonly status: StudentStatus;
  readonly avatarUrl: string | null;
  readonly dateOfBirth: Date | null;
  readonly gender: Gender | null;
  readonly language: AppLanguage | null;
  readonly timezoneOverride: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly timezone: IanaTimezone | null;
  readonly displayCurrency: CurrencyCode | null;
  readonly parentId: string | null;
  readonly parentUserId: string | null;
  readonly parentName: string | null;
  readonly parentEmail: string | null;
  readonly parentPhone: string | null;
  readonly isAssociatedViewer: boolean;
  readonly primaryTeacherId: string | null;
  readonly teacherUserId: string | null;
  readonly teacherName: string | null;
  readonly hoursPerWeek: number | null;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly upcomingClasses: StudentUpcomingClassesResult | null;
  readonly classHistory: StudentClassHistory | null;
};

/**
 * Own-profile edit payload for LMS students.
 * Excludes email, teacher assignment, academic/quota fields, and parent reassignment.
 */
export type StudentProfileEditInput = {
  readonly phone?: string | null;
  readonly timezone?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly dateOfBirth?: Date | null;
  readonly gender?: Gender | null;
  readonly language?: AppLanguage | null;
  readonly timezoneOverride?: string | null;
  readonly avatarUrl?: string | null;
  /** Updates linked parent user phone when the student has a parent link. */
  readonly parentPhone?: string | null;
};
