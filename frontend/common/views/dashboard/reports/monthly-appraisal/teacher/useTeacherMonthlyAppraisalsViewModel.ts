"use client";

import type { MonthlyAppraisalLabels } from "@/shared/locale/types/dashboard/reports/monthly-appraisal";

/** A student row in the teacher appraisal list (with optional appraisal-for-month summary). */
export interface MonthlyAppraisalStudentRow {
  readonly id: string;
  readonly name: string;
  readonly studentAvatarUrl: string | null;
  readonly appraisalForMonth: {
    readonly id: string;
    readonly month: string;
    readonly updatedAt: string;
  } | null;
}

export interface MonthlyAppraisalTeacherViewModel {
  readonly labels: MonthlyAppraisalLabels;
  readonly students: readonly MonthlyAppraisalStudentRow[];
  readonly loading: boolean;
  readonly selectedMonth: string;
  readonly onMonthChange: (month: string) => void;
  readonly onOpenForm: (studentId: string) => void;
  readonly error: boolean;
}
