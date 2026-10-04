import type { StudentDirectoryQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  StudentEnrollmentStatus as EnrollmentEnum,
  STUDENT_STATUS_TO_ACCOUNT_STATUS,
  type StudentAccountStatus,
  type StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { StudentsLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/students/types/studentsDirectory.types";
import {
  getEnrollmentStatus,
  isStudentStatus,
  type RawStudentRow,
} from "@/frontend/common/views/dashboard/admin/parents/students/utils.helpers";
import {
  METRIC_DEFINITIONS,
  toMetricItem,
} from "@/frontend/common/views/dashboard/admin/parents/students/utils.metrics";
import type { StudentDirectoryLabels } from "@/shared/locale";

export function mapStudentAccountStatus(status: string | null | undefined): StudentAccountStatus {
  if (!status) return "regular";
  const upper = status.toUpperCase();
  if (!isStudentStatus(upper)) return "regular";
  return STUDENT_STATUS_TO_ACCOUNT_STATUS[upper] ?? "regular";
}

export function buildStudentRows(data: StudentDirectoryQuery | undefined): StudentDirectoryRowExtended[] {
  if (!data?.studentDirectory?.rows) return [];
  return data.studentDirectory.rows.map((row: RawStudentRow, index: number) => {
    const accountStatus = mapStudentAccountStatus(row.status);
    return {
      ...row,
      id: row.id ?? "",
      index: index + 1,
      name: row.name ?? "",
      email: row.email ?? "",
      accountStatus,
      enrollmentStatus: getEnrollmentStatus(row.status),
      hoursPerWeek: row.hoursPerWeek ?? 0,
      classesRemaining: row.classesRemaining ?? 0,
      classesTotal: row.classesTotal ?? 0,
      isDeactivated: accountStatus === "deactivated",
    };
  });
}

export function buildStatusCounts(rows: StudentDirectoryRowExtended[]): Record<StudentAccountStatus, number> {
  const res: Record<StudentAccountStatus, number> = {
    deactivated: 0,
    regular: 0,
    on_leave: 0,
    suspended: 0,
    on_trial: 0,
  };
  for (const r of rows) {
    res[r.accountStatus] = (res[r.accountStatus] || 0) + 1;
  }
  return res;
}

export function buildViewMetrics(
  counts: Record<StudentAccountStatus, number>,
  t: StudentDirectoryLabels
): MetricItem[] {
  return METRIC_DEFINITIONS.map(({ key, icon }) => toMetricItem(key, counts[key], icon, t));
}

export function buildLabelsBySection(t: StudentDirectoryLabels): StudentsLabelsBySection {
  return {
    shell: {
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      mobileTitle: t.mobileTitle,
      globalRecord: t.globalRecord,
      noEntries: t.noEntries,
    },
    filters: {
      searchPlaceholder: t.searchPlaceholder,
      filters: t.filters,
    },
    actions: {
      addStudent: t.addStudent,
      viewProfile: t.actions.viewProfile,
      viewHistory: t.actions.viewHistory,
    },
    columns: {
      index: t.table.index,
      student: t.table.student,
      email: t.table.email,
      status: t.table.status,
      hoursPerWeek: t.table.hoursPerWeek,
      classesLeft: t.table.classesLeft,
      actions: t.table.actions,
      showingOf: t.showingOf,
      previous: t.previous,
      next: t.next,
      viewProfile: t.actions.viewProfile,
      viewHistory: t.actions.viewHistory,
      noEntries: t.noEntries,
      statusLabels: {
        deactivated: t.status.deactivated,
        regular: t.status.regular,
        on_leave: t.status.onLeave,
        suspended: t.status.suspended,
        on_trial: t.status.onTrial,
      },
    },
    cards: {
      weeklyHours: t.card.weeklyHours,
      enrollmentStatus: t.card.enrollmentStatus,
      classesLeft: t.table.classesLeft,
      viewProfile: t.actions.viewProfile,
      statusLabels: {
        deactivated: t.status.deactivated,
        regular: t.status.regular,
        on_leave: t.status.onLeave,
        suspended: t.status.suspended,
        on_trial: t.status.onTrial,
      },
      enrollmentLabels: {
        [EnrollmentEnum.REGULAR]: t.enrollment.regular,
        [EnrollmentEnum.PROSPECT]: t.enrollment.prospect,
        [EnrollmentEnum.WITHDRAWN]: t.enrollment.withdrawn,
      },
    },
  };
}
