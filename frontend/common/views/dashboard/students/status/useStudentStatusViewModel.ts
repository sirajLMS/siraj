"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { type MutableRefObject, useCallback, useEffect, useMemo, useRef } from "react";
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
import type {
  StudentStatusPageData,
  UpcomingClassDisplay,
} from "@/frontend/common/views/dashboard/students/status/types";
import { type CommonLabels, type StudentStatusLabels, useAppTranslation } from "@/shared/locale";

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

type StudentByIdType = NonNullable<GqlOperations.StudentByIdQuery["studentById"]>;
type StudentUpcomingType = GqlOperations.StudentUpcomingClassesQuery["studentUpcomingClasses"] | undefined;

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

function buildStudentFromQuery(student: StudentByIdType, upcoming: StudentUpcomingType): StudentStatusPageData | null {
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

type QueryResult = {
  readonly studentData: GqlOperations.StudentByIdQuery | undefined;
  readonly studentLoading: boolean;
  readonly studentError: unknown;
  readonly upcomingData: GqlOperations.StudentUpcomingClassesQuery | undefined;
  readonly upcomingLoading: boolean;
  readonly upcomingError: unknown;
  readonly refetchUpcoming: (() => Promise<unknown> | undefined) | undefined;
};

function useStudentStatusQueries(studentId: string, useUnifiedProfile: boolean): QueryResult {
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

  return { studentData, studentLoading, studentError, upcomingData, upcomingLoading, upcomingError, refetchUpcoming };
}

type PermissionsResult = {
  readonly canEditStatus: boolean;
  readonly canViewStatus: boolean;
  readonly canViewSchedule: boolean;
  readonly hasTabAccess: boolean;
};

function useStudentStatusPermissions(): PermissionsResult {
  const { canView, canEdit } = useStudentFieldAccess();
  return {
    canEditStatus: canEdit("student_academic"),
    canViewStatus: canView("student_academic"),
    canViewSchedule: canView("student_schedule"),
    hasTabAccess: canViewStudentProfileTab("status", canView),
  };
}

type DataEnv = {
  readonly studentId: string;
  readonly useUnifiedProfile: boolean;
  readonly profileContext: ReturnType<typeof useStudentProfileContext>;
};

type DataResult = {
  readonly student: StudentStatusPageData | null;
  readonly versionRef: MutableRefObject<number | null>;
  readonly queries: QueryResult;
};

function useStudentStatusData(env: Readonly<DataEnv>): DataResult {
  const { studentId, useUnifiedProfile, profileContext } = env;
  const queries = useStudentStatusQueries(studentId, useUnifiedProfile);

  const student: StudentStatusPageData | null = useMemo(() => {
    if (useUnifiedProfile) {
      const profile = profileContext?.profile;
      return profile ? buildStudentFromProfile(profile) : null;
    }
    const s = queries.studentData?.studentById;
    if (!s?.id || !s.name) return null;
    return buildStudentFromQuery(s, queries.upcomingData?.studentUpcomingClasses);
  }, [useUnifiedProfile, profileContext?.profile, queries.studentData, queries.upcomingData]);

  const versionRef = useRef<number | null>(student?.version ?? null);
  useEffect(() => {
    versionRef.current = student?.version ?? null;
  }, [student?.version]);

  return { student, versionRef, queries };
}

function useChangeStudentStatusMutation(env: {
  readonly studentId: string;
  readonly useUnifiedProfile: boolean;
  readonly refetchUpcoming: QueryResult["refetchUpcoming"];
  readonly profileContext: ReturnType<typeof useStudentProfileContext>;
  readonly t: StudentStatusLabels;
  readonly tc: CommonLabels;
}) {
  const { studentId, useUnifiedProfile, refetchUpcoming, profileContext, t, tc } = env;
  const notifications = useNotifications();

  const handleMutationCompleted = useCallback(() => {
    notifications.show(t.successMessage, {
      severity: "success",
      autoHideDuration: 5000,
    });
    if (useUnifiedProfile) {
      profileContext?.refetch()?.catch(() => undefined);
    } else {
      refetchUpcoming?.()?.catch(() => undefined);
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

  return { changeStatus, isUpdating };
}

function useStudentStatusFormState(env: {
  readonly student: StudentStatusPageData | null;
  readonly studentId: string;
  readonly t: StudentStatusLabels;
  readonly changeStatus: ReturnType<typeof useChangeStudentStatusMutation>["changeStatus"];
  readonly versionRef: MutableRefObject<number | null>;
}) {
  const { student, studentId, t, changeStatus, versionRef } = env;
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

  return { methods, selectedStatus, handleSubmit };
}

function useStudentStatusDerived(env: {
  readonly studentId: string;
  readonly useUnifiedProfile: boolean;
  readonly profileContext: ReturnType<typeof useStudentProfileContext>;
  readonly queries: QueryResult;
  readonly tc: CommonLabels;
}) {
  const { studentId, useUnifiedProfile, profileContext, queries, tc } = env;
  const loading = useUnifiedProfile
    ? Boolean(profileContext?.loading)
    : queries.studentLoading || queries.upcomingLoading;
  const error =
    !studentId || (!useUnifiedProfile && (queries.studentError || queries.upcomingError)) ? tc.loadFailed : null;
  return { loading, error };
}

function useUpdateStatusHandler(env: {
  readonly studentId: string;
  readonly changeStatus: ReturnType<typeof useChangeStudentStatusMutation>["changeStatus"];
  readonly versionRef: MutableRefObject<number | null>;
}) {
  const { studentId, changeStatus, versionRef } = env;
  return useCallback(
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
    [studentId, changeStatus, versionRef.current]
  );
}

function useStudentStatusLayout(canEditStatus: boolean, canViewStatus: boolean, canViewSchedule: boolean) {
  return {
    hasLeftColumn: canEditStatus || (canViewStatus && !canEditStatus),
    hasRightColumn: canViewSchedule,
    hasContent: canEditStatus || (canViewStatus && !canEditStatus),
  };
}

export function useStudentStatusViewModel(props: Readonly<UseStudentStatusViewModelProps>): StudentStatusViewModel {
  const t = useAppTranslation().dashboardTranslations.studentStatus;
  const tc = useAppTranslation().commonTranslations;
  const params = useParams();
  const profileContext = useStudentProfileContext();
  const studentId = props.studentId ?? profileContext?.studentId ?? (typeof params?.id === "string" ? params.id : "");
  const useUnifiedProfile = profileContext != null;

  const { canEditStatus, canViewStatus, canViewSchedule, hasTabAccess } = useStudentStatusPermissions();

  const { student, versionRef, queries } = useStudentStatusData({
    studentId,
    useUnifiedProfile,
    profileContext,
  });

  const { changeStatus, isUpdating } = useChangeStudentStatusMutation({
    studentId,
    useUnifiedProfile,
    refetchUpcoming: queries.refetchUpcoming,
    profileContext,
    t,
    tc,
  });

  const { methods, selectedStatus, handleSubmit } = useStudentStatusFormState({
    student,
    studentId,
    t,
    changeStatus,
    versionRef,
  });

  const handleUpdateStatus = useUpdateStatusHandler({ studentId, changeStatus, versionRef });

  const { loading, error } = useStudentStatusDerived({
    studentId,
    useUnifiedProfile,
    profileContext,
    queries,
    tc,
  });

  const { hasLeftColumn, hasRightColumn, hasContent } = useStudentStatusLayout(
    canEditStatus,
    canViewStatus,
    canViewSchedule
  );

  return {
    t,
    tc,
    student,
    embedded: useUnifiedProfile,
    isUpdating,
    canEditStatus,
    canViewSchedule,
    hasTabAccess,
    loading,
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
