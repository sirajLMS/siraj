import {
  AppPermission,
  CalculationStatus,
  ClassExecutionState,
  type ClassInstanceQuery,
  ClassOutcome,
  ClassType,
  CurrencyCode,
  RateSource,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { IanaTimezone } from "@/shared/constants";

/** Payroll snapshot for the drilled-into class instance (drives the payroll card and the override dialog row). */
export const mockPayrollInstance: ClassInstanceQuery = {
  classInstance: {
    id: "story-class-id",
    courseName: "Quran Recitation - Advanced",
    classType: ClassType.Regular,
    instanceId: "story-class-id",
    scheduledDate: "2026-06-27",
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: ClassExecutionState.Completed,
    remarks: null,
    hasTimezoneMismatch: false,
    studentTimezone: IanaTimezone.Asia_Riyadh,
    teacherTimezone: IanaTimezone.Asia_Riyadh,
    recurringScheduleId: null,
    effectiveMeeting: null,
    payrollCredited: false,
    calculationStatus: CalculationStatus.Calculated,
    teacherPaidAmount: "180.00",
    teacherPaidCurrency: CurrencyCode.Sar,
    calculatedDuration: 62,
    isPartialPercentage: null,
    payrollNote:
      "Session ran two minutes over the scheduled hour; billed in full under the standing rate agreement with the teacher.",
    payrollCalculatedAt: "2026-06-27T11:05:00.000Z",
    isRescheduled: true,
    isFrozen: false,
    executionState: ClassExecutionState.Completed,
    outcome: ClassOutcome.Taken,
    avatarUrl: null,
    subjectId: "sub-1",
    subjectName: "Quran Recitation",
    subjectAvatarUrl: null,
    rateAmount: "180.00",
    rateCurrency: CurrencyCode.Sar,
    isRateOverridden: false,
    rateSource: RateSource.Teacher,
    student: { id: "s1", name: "Fatima Al-Rashid", grade: "Grade 8", level: "Advanced", avatarUrl: null },
    teacher: { id: "t1", name: "Ustadh Ahmad", title: "Quran Teacher", avatarUrl: null },
    performance: null,
  },
};

/** Payroll permissions unlock the payroll card and the override dialog on the audit page. */
export const PAYROLL_PERMISSIONS = [AppPermission.AccountingPayrollView, AppPermission.AccountingPayrollManage];
