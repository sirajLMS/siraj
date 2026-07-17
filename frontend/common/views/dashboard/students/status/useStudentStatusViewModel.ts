"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import {
  ClassExecutionState as GqlClassExecutionState,
  StudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as GqlOperations from "@/frontend/common/graphql/generated/gql/operations";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { changeStudentStatusMutationDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-lifecycle.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { studentUpcomingClassesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-status.documents";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { logger } from "@/frontend/common/utils/logger";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import { canViewStudentProfileTab } from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import {
  createStatusUpdateSchema,
  type StatusUpdateFormData,
} from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import { useRouter } from "@/shared/i18n/routing";
import { type CommonLabels, type StudentStatusLabels, useAppTranslation } from "@/shared/locale";

type UpcomingClassInput = {
  readonly id?: string | null;
  readonly instructor?: string | null;
  readonly teacherId?: string | null;
  readonly scheduledStartAt?: string | null;
  readonly scheduledEndAt?: string | null;
  readonly durationMinutes?: number | null;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly isFrozen?: boolean | null;
  readonly meetingJoinUrl?: string | null;
  readonly effectiveMeeting?: EffectiveMeetingFieldsFragment | null;
};

export interface UpcomingClassDisplay {
  readonly id: string;
  readonly instructor: string;
  readonly teacherId: string | null;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly durationMinutes: number;
  readonly executionState: string;
  readonly outcome: string | null;
  readonly isFrozen: boolean;
  readonly meetingJoinUrl: string | null | undefined;
  readonly effectiveMeeting: EffectiveMeetingFieldsFragment | null;
}

function mapUpcomingClasses(classes: readonly UpcomingClassInput[] | null | undefined): UpcomingClassDisplay[] {
  return (classes ?? []).map(cls => ({
    id: cls?.id ?? "",
    instructor: cls?.instructor ?? "",
    teacherId: cls?.teacherId ?? null,
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

type StudentById = NonNullable<GqlOperations.StudentByIdQuery["studentById"]>;
type StudentUpcoming = GqlOperations.StudentUpcomingClassesQuery["studentUpcomingClasses"] | undefined;

function buildStudentFromProfile(profile: NonNullable<StudentProfileQueryData>): StudentStatusPageData | null {
  if (!profile.id || !profile.name) return null;
  return {
    id: profile.id,
    name: profile.name ?? "",
    status: profile.upcomingClasses?.status ?? profile.status ?? StudentStatus.Regular,
    avatarUrl: profile.avatarUrl ?? null,
    primaryTeacherId: profile.primaryTeacherId ?? null,
    teacherName: profile.teacherName ?? null,
    parentUserId: profile.parentUserId ?? null,
    hoursPerWeek: profile.hoursPerWeek != null ? String(profile.hoursPerWeek) : null,
    classesRemaining: profile.classesRemaining ?? 0,
    classesTotal: profile.classesTotal ?? 0,
    version: profile.version ?? null,
    upcomingClasses: mapUpcomingClasses(profile.upcomingClasses?.classes),
  };
}

function buildStudentFromQuery(student: StudentById, upcoming: StudentUpcoming): StudentStatusPageData | null {
  if (!student.id || !student.name) return null;
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

export interface UseStudentStatusViewModelProps {
  readonly studentId?: string;
}

export interface StudentStatusViewModel {
  readonly t: StudentStatusLabels;
  readonly tc: CommonLabels;
  readonly student: StudentStatusPageData | null;
  readonly embedded: boolean;
  readonly isUpdating: boolean;
  readonly canEditStatus: boolean;
  readonly canViewSchedule: boolean;
  readonly hasTabAccess: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly handleUpdateStatus: (status: StudentStatus, reason: string) => Promise<void>;
  readonly hasLeftColumn: boolean;
  readonly hasRightColumn: boolean;
  readonly hasContent: boolean;
  readonly selectedStatus: StudentStatus;
  readonly methods: UseFormReturn<StatusUpdateFormData>;
  readonly handleSubmit: (data: StatusUpdateFormData) => Promise<void>;
}

export function useStudentStatusViewModel(props: Readonly<UseStudentStatusViewModelProps>): StudentStatusViewModel {
  const t = useAppTranslation().dashboardTranslations.studentStatus;
  const tc = useAppTranslation().commonTranslations;
  const params = useParams();
  const profileContext = useStudentProfileContext();
  const _router = useRouter();
  const notifications = useNotifications();
  const studentId = props.studentId ?? profileContext?.studentId ?? (typeof params?.id === "string" ? params.id : "");
  const useUnifiedProfile = profileContext != null;
  const { canView, canEdit } = useStudentFieldAccess();
  const canEditStatus = canEdit("student_academic");
  const canViewStatus = canView("student_academic");
  const canViewSchedule = canView("student_schedule");
  const hasTabAccess = canViewStudentProfileTab("status", canView);

  const {
    data: studentData,
    loading: studentLoading,
    error: studentError,
  } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId || useUnifiedProfile,
  });

  const {
    data: upcomingData,
    loading: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useQuery(studentUpcomingClassesQueryDocument, {
    variables: { studentId },
    skip: !studentId || useUnifiedProfile,
  });

  const handleMutationCompleted = useCallback(() => {
    notifications.show(t.successMessage, {
      severity: "success",
      autoHideDuration: 5000,
    });
    if (useUnifiedProfile) {
      profileContext?.refetch()?.catch(() => undefined);
    } else {
      refetchUpcoming()?.catch(() => undefined);
    }
  }, [notifications, t, useUnifiedProfile, profileContext, refetchUpcoming]);

  const handleMutationError = useCallback(
    (error: unknown) => {
      logger.error("Change student status failed:", { error });
      notifications.show(tc.operationFailed, {
        severity: "error",
        autoHideDuration: 5000,
      });
    },
    [notifications, tc]
  );

  const refetchQueries = useUnifiedProfile
    ? [{ query: studentProfileQueryDocument, variables: { studentId } }]
    : [{ query: studentByIdQueryDocument, variables: { studentId } }];

  const [changeStatus, { loading: isUpdating }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: handleMutationCompleted,
    onError: handleMutationError,
    refetchQueries,
  });

  const student: StudentStatusPageData | null = useMemo(() => {
    if (useUnifiedProfile) {
      const profile = profileContext?.profile;
      return profile ? buildStudentFromProfile(profile) : null;
    }

    const s = studentData?.studentById;
    if (!s?.id || !s.name) return null;
    return buildStudentFromQuery(s, upcomingData?.studentUpcomingClasses);
  }, [useUnifiedProfile, profileContext?.profile, studentData, upcomingData]);

  const versionRef = useRef(student?.version ?? null);
  useEffect(() => {
    versionRef.current = student?.version ?? null;
  }, [student?.version]);

  const schema = createStatusUpdateSchema(t.validation);

  const methods = useForm<StatusUpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: StudentStatus.Regular,
      reason: "",
    },
  });

  const selectedStatus = methods.watch("status", StudentStatus.Regular);

  useEffect(() => {
    methods.reset({
      status: student?.status ?? StudentStatus.Regular,
      reason: "",
    });
  }, [student, methods]);

  const handleSubmit = async (data: StatusUpdateFormData) => {
    await changeStatus({
      variables: {
        studentId,
        newStatus: data.status,
        expectedVersion: versionRef.current,
      },
    });
    methods.reset({ status: data.status, reason: "" });
  };

  const handleUpdateStatus = useCallback(
    async (status: StudentStatus, _reason: string) => {
      if (!studentId) return;
      await changeStatus({
        variables: {
          studentId,
          newStatus: status,
          expectedVersion: versionRef.current,
        },
      });
    },
    [studentId, changeStatus]
  );

  const unifiedLoading = useUnifiedProfile ? Boolean(profileContext?.loading) : studentLoading || upcomingLoading;
  const _hasProfile = useUnifiedProfile ? Boolean(profileContext?.profile) : Boolean(studentData?.studentById);

  const error = !studentId || (!useUnifiedProfile && (studentError || upcomingError)) ? tc.loadFailed : null;

  const hasLeftColumn = canEditStatus || (canViewStatus && !canEditStatus);
  const hasRightColumn = canViewSchedule;
  const hasContent = hasLeftColumn || hasRightColumn;

  return {
    t,
    tc,
    student,
    embedded: useUnifiedProfile,
    isUpdating,
    canEditStatus,
    canViewSchedule,
    hasTabAccess,
    loading: unifiedLoading,
    error,
    handleUpdateStatus,
    hasLeftColumn,
    hasRightColumn,
    hasContent,
    selectedStatus,
    methods,
    handleSubmit,
  };
}
