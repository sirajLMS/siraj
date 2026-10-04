import {
  type EffectiveMeetingFieldsFragment,
  ClassExecutionState as GqlClassExecutionState,
  type StudentByIdQuery_studentById,
  StudentStatus,
  type StudentUpcomingClassesQuery_studentUpcomingClasses,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import type {
  StudentStatusPageData,
  UpcomingClassDisplay,
} from "@/frontend/common/views/dashboard/students/status/types";

type UpcomingClassInput = {
  readonly id?: string | null;
  readonly instructor?: string | null;
  readonly teacherId?: string | null;
  readonly teacherAvatarUrl?: string | null;
  readonly subjectId?: string | null;
  readonly subjectName?: string | null;
  readonly avatarUrl?: string | null;
  readonly scheduledStartAt?: string | null;
  readonly scheduledEndAt?: string | null;
  readonly durationMinutes?: number | null;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly isFrozen?: boolean | null;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
};

function mapUpcomingClasses(classes: readonly UpcomingClassInput[] | null | undefined): UpcomingClassDisplay[] {
  return (classes ?? []).map(cls => ({
    id: cls?.id ?? "",
    instructor: cls?.instructor ?? "",
    teacherId: cls?.teacherId ?? null,
    teacherAvatarUrl: cls?.teacherAvatarUrl ?? null,
    subjectId: cls?.subjectId ?? null,
    subjectName: cls?.subjectName ?? null,
    avatarUrl: cls?.avatarUrl ?? null,
    scheduledStartAt: cls?.scheduledStartAt ?? "",
    scheduledEndAt: cls?.scheduledEndAt ?? "",
    durationMinutes: cls?.durationMinutes ?? 0,
    executionState: cls?.executionState ?? GqlClassExecutionState.NotActivated,
    outcome: cls?.outcome ?? null,
    isFrozen: cls?.isFrozen ?? false,
    meetingJoinUrl: cls?.meetingJoinUrl,
    effectiveMeeting: cls?.effectiveMeeting,
  }));
}

type StudentByIdType = NonNullable<StudentByIdQuery_studentById>;
type StudentUpcomingType = NonNullable<StudentUpcomingClassesQuery_studentUpcomingClasses> | undefined;

export function buildStudentFromProfile(profile: NonNullable<StudentProfileQueryData>): StudentStatusPageData | null {
  if (!profile.id || !profile.name) return null;
  return {
    id: profile.id,
    name: profile.name ?? "",
    status: profile.upcomingClasses?.status ?? profile.status ?? StudentStatus.Regular,
    avatarUrl: profile.avatarUrl ?? null,
    primaryTeacherId: profile.primaryTeacherId ?? null,
    teacherName: profile.teacherName ?? null,
    parentUserId: profile.parentUserId ?? null,
    hoursPerWeek: profile.hoursPerWeek == null ? null : String(profile.hoursPerWeek),
    classesRemaining: profile.classesRemaining ?? 0,
    classesTotal: profile.classesTotal ?? 0,
    version: profile.version ?? null,
    upcomingClasses: mapUpcomingClasses(profile.upcomingClasses?.classes),
  };
}

export function buildStudentFromQuery(
  student: StudentByIdType,
  upcoming: StudentUpcomingType
): StudentStatusPageData | null {
  if (student.id && student.name) {
    return {
      id: student.id,
      name: student.name,
      status: upcoming?.status ?? student.status ?? StudentStatus.Regular,
      avatarUrl: null,
      primaryTeacherId: student.primaryTeacherId ?? null,
      teacherName: student.teacherName ?? null,
      hoursPerWeek: student.hoursPerWeek ?? null,
      classesRemaining: student.classesRemaining ?? 0,
      classesTotal: student.classesTotal ?? 0,
      version: student.version ?? null,
      upcomingClasses: mapUpcomingClasses(upcoming?.classes),
    };
  }
  return null;
}

export function useStudentStatusLayout(canEditStatus: boolean, canViewStatus: boolean, canViewSchedule: boolean) {
  return {
    hasLeftColumn: canEditStatus || (canViewStatus && !canEditStatus),
    hasRightColumn: canViewSchedule,
    hasContent: canEditStatus || (canViewStatus && !canEditStatus),
  };
}
