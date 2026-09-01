import type {
  EffectiveMeetingFieldsFragment,
  StudentCreditBalanceQuery,
  StudentProfileQuery,
  StudentRecentLessonReportsQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  RecentLessonReportRow,
  StudentCreditBalanceRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";

type UpcomingClassItem = NonNullable<
  NonNullable<NonNullable<StudentProfileQuery["studentProfile"]>["upcomingClasses"]>["classes"]
>[number];

function resolveJoinUrl(
  meetingJoinUrl?: string | null,
  effectiveMeeting?: EffectiveMeetingFieldsFragment | null
): string | null {
  const fromEffective = effectiveMeeting?.joinUrl?.trim();
  const fromLegacy = meetingJoinUrl?.trim();
  return fromEffective ?? fromLegacy ?? null;
}

function mapUpcomingLesson(raw: UpcomingClassItem): UpcomingLessonRow {
  return {
    id: raw.id ?? "",
    instructor: raw.instructor ?? "",
    teacherId: raw.teacherId ?? null,
    scheduledStartAt: raw.scheduledStartAt ?? null,
    scheduledEndAt: raw.scheduledEndAt ?? null,
    durationMinutes: raw.durationMinutes ?? 0,
    executionState: raw.executionState ?? null,
    outcome: raw.outcome ?? null,
    isFrozen: raw.isFrozen ?? false,
    meetingJoinUrl: resolveJoinUrl(raw.meetingJoinUrl, raw.effectiveMeeting),
    effectiveMeeting: raw.effectiveMeeting ?? null,
  };
}

export function mapUpcomingLessons(profile: StudentProfileQuery["studentProfile"] | undefined): UpcomingLessonRow[] {
  const classes = profile?.upcomingClasses?.classes;
  if (!classes) return [];
  return classes.map(mapUpcomingLesson);
}

type RecentReportItem = NonNullable<
  NonNullable<NonNullable<StudentRecentLessonReportsQuery["studentRecentLessonReports"]>["rows"]>[number]
>;

function mapRecentLessonReport(raw: RecentReportItem): RecentLessonReportRow {
  return {
    id: raw.id ?? "",
    classInstanceId: raw.classInstanceId ?? null,
    subjectName: raw.subjectName ?? null,
    classAvatarUrl: raw.classAvatarUrl ?? null,
    teacherId: raw.teacherId ?? null,
    teacherName: raw.teacherName ?? null,
    teacherAvatarUrl: raw.teacherAvatarUrl ?? null,
    lessonDate: raw.lessonDate ?? null,
    durationMinutes: raw.durationMinutes ?? 0,
    status: raw.status ?? null,
    completionPercentage: raw.completionPercentage ?? 0,
    attendanceEvaluation: raw.attendanceEvaluation ?? null,
    teacherNotes: raw.teacherNotes ?? null,
    studentNotes: raw.studentNotes ?? null,
  };
}

export function mapRecentLessonReports(
  reports: NonNullable<StudentRecentLessonReportsQuery["studentRecentLessonReports"]>["rows"] | undefined
): RecentLessonReportRow[] {
  if (!reports) return [];
  return reports.map(mapRecentLessonReport);
}

export function mapCreditBalance(
  balance: StudentCreditBalanceQuery["studentCreditBalance"] | undefined
): StudentCreditBalanceRow {
  return {
    classesRemaining: balance?.classesRemaining ?? 0,
    classesTotal: balance?.classesTotal ?? 0,
  };
}

export function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate()
  );
}

export function isWithinNextDays(dateString: string | null, days: number): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const now = Date.now();
  const end = now + days * 24 * 60 * 60 * 1000;
  const ts = date.getTime();
  return ts >= now && ts <= end;
}
