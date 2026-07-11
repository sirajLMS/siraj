"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ClassExecutionState as GqlClassExecutionState,
  StudentStatus,
} from "@/frontend/graphql/generated/gql/graphql-types";
import type * as GqlOperations from "@/frontend/graphql/generated/gql/operations";
import { studentByIdQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student.documents";
import { changeStudentStatusMutationDocument } from "@/frontend/graphql/sharedDocuments/students/student-lifecycle.documents";
import { studentProfileQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-profile.documents";
import { studentUpcomingClassesQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-status.documents";
import { logger } from "@/frontend/utils/logger";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type { StudentProfileQueryData } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";
import { useStudentProfileContext } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";
import { StudentStatusView } from "@/frontend/views/dashboard/students/status/StudentStatusView";
import type { StudentStatusPageData, UpcomingClassDisplay } from "@/frontend/views/dashboard/students/status/types";

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
  readonly effectiveMeeting?: UpcomingClassDisplay["effectiveMeeting"];
};

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

function ErrorMessage({ message }: { readonly message: string }) {
  return <Typography sx={{ color: theme => theme.palette.error.main }}>{message}</Typography>;
}

interface StudentStatusHookParams {
  readonly studentId: string;
  readonly useUnifiedProfile: boolean;
  readonly profileContext: ReturnType<typeof useStudentProfileContext>;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly t: ReturnType<typeof useTranslations>;
  readonly tc: ReturnType<typeof useTranslations>;
}

interface StudentStatusHookResult {
  readonly student: StudentStatusPageData | null;
  readonly isUpdating: boolean;
  readonly handleUpdateStatus: (status: StudentStatus, reason: string) => Promise<void>;
  readonly studentError: unknown;
  readonly upcomingError: unknown;
  readonly unifiedLoading: boolean;
  readonly hasProfile: boolean;
}

function useStudentStatusData({
  studentId,
  useUnifiedProfile,
  profileContext,
  notifications,
  t,
  tc,
}: StudentStatusHookParams): StudentStatusHookResult {
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
    notifications.show(t("successMessage"), {
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
      notifications.show(tc("operationFailed"), {
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
  const hasProfile = useUnifiedProfile ? Boolean(profileContext?.profile) : Boolean(studentData?.studentById);

  return { student, isUpdating, handleUpdateStatus, studentError, upcomingError, unifiedLoading, hasProfile };
}

export function StudentStatusContainer() {
  const t = useTranslations("dashboard.studentStatus");
  const tc = useTranslations("common");
  const params = useParams();
  const profileContext = useStudentProfileContext();
  const studentId = profileContext?.studentId ?? (typeof params?.id === "string" ? params.id : "");
  const notifications = useNotifications();
  const useUnifiedProfile = profileContext != null;

  const { student, isUpdating, handleUpdateStatus, studentError, upcomingError, unifiedLoading, hasProfile } =
    useStudentStatusData({ studentId, useUnifiedProfile, profileContext, notifications, t, tc });

  if (!studentId) {
    return <ErrorMessage message={t("errors.invalidId")} />;
  }

  if (unifiedLoading && !hasProfile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!useUnifiedProfile && (studentError || upcomingError)) {
    logger.error("Error loading student status:", { studentError, upcomingError });
    return <ErrorMessage message={tc("loadFailed")} />;
  }

  if (!student) {
    if (useUnifiedProfile) {
      return <ProfileRestrictedSection title={t("sections.adminHold")} />;
    }
    return <ErrorMessage message={t("errors.invalidId")} />;
  }

  return (
    <StudentStatusView
      student={student}
      isUpdating={isUpdating}
      embedded={useUnifiedProfile}
      onUpdateStatus={handleUpdateStatus}
    />
  );
}
