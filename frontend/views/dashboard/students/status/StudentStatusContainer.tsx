"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  AppPermission,
  ClassExecutionState as GqlClassExecutionState,
  StudentStatus,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { studentByIdQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student.documents";
import { changeStudentStatusMutationDocument } from "@/frontend/graphql/sharedDocuments/students/student-lifecycle.documents";
import { studentProfileQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-profile.documents";
import { studentUpcomingClassesQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-status.documents";
import { logger } from "@/frontend/utils/logger";
import { useStudentProfileContext } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";
import { StudentStatusView } from "@/frontend/views/dashboard/students/status/StudentStatusView";
import type { StudentStatusPageData, UpcomingClassDisplay } from "@/frontend/views/dashboard/students/status/types";

export function StudentStatusContainer() {
  const t = useTranslations("dashboard.studentStatus");
  const tc = useTranslations("common");
  const params = useParams();
  const profileContext = useStudentProfileContext();
  const studentId = profileContext?.studentId ?? (typeof params?.id === "string" ? params.id : "");
  const notifications = useNotifications();
  const useUnifiedProfile = profileContext != null;

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

  const [changeStatus, { loading: isUpdating }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: () => {
      notifications.show(t("successMessage"), {
        severity: "success",
        autoHideDuration: 5000,
      });
      if (useUnifiedProfile) {
        void profileContext?.refetch();
      } else {
        void refetchUpcoming();
      }
    },
    onError: error => {
      logger.error("Change student status failed:", { error });
      notifications.show(tc("operationFailed"), {
        severity: "error",
        autoHideDuration: 5000,
      });
    },
    refetchQueries: useUnifiedProfile
      ? [{ query: studentProfileQueryDocument, variables: { studentId } }]
      : [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const student: StudentStatusPageData | null = useMemo(() => {
    if (useUnifiedProfile) {
      const profile = profileContext?.profile;
      if (!profile?.id || !profile.name) return null;

      const upcomingClasses: UpcomingClassDisplay[] = (profile.upcomingClasses?.classes ?? []).map(cls => ({
        id: cls?.id ?? "",
        instructor: cls?.instructor ?? "",
        teacherId: cls?.teacherId ?? null,
        scheduledStartAt: cls?.scheduledStartAt ?? "",
        scheduledEndAt: cls?.scheduledEndAt ?? "",
        durationMinutes: cls?.durationMinutes ?? 0,
        executionState: cls?.executionState ?? GqlClassExecutionState.NotActivated,
        isFrozen: cls?.isFrozen ?? false,
        meetingJoinUrl: cls?.meetingJoinUrl,
        effectiveMeeting: cls?.effectiveMeeting,
      }));

      return {
        id: profile.id,
        name: profile.name,
        status: profile.upcomingClasses?.status ?? profile.status ?? StudentStatus.Regular,
        avatarUrl: profile.avatarUrl ?? null,
        primaryTeacherId: profile.primaryTeacherId ?? null,
        teacherName: profile.teacherName ?? null,
        hoursPerWeek: profile.hoursPerWeek != null ? String(profile.hoursPerWeek) : null,
        classesRemaining: profile.classesRemaining ?? 0,
        classesTotal: profile.classesTotal ?? 0,
        version: profile.version ?? null,
        upcomingClasses,
      };
    }

    const s = studentData?.studentById;
    const uc = upcomingData?.studentUpcomingClasses;
    if (!s?.id || !s.name) return null;

    const upcomingClasses: UpcomingClassDisplay[] = (uc?.classes ?? []).map(cls => ({
      id: cls?.id ?? "",
      instructor: cls?.instructor ?? "",
      teacherId: cls?.teacherId ?? null,
      scheduledStartAt: cls?.scheduledStartAt ?? "",
      scheduledEndAt: cls?.scheduledEndAt ?? "",
      durationMinutes: cls?.durationMinutes ?? 0,
      executionState: cls?.executionState ?? GqlClassExecutionState.NotActivated,
      isFrozen: cls?.isFrozen ?? false,
    }));

    return {
      id: s.id,
      name: s.name,
      status: uc?.status ?? s.status ?? StudentStatus.Regular,
      avatarUrl: null,
      primaryTeacherId: s.primaryTeacherId ?? null,
      teacherName: s.teacherName ?? null,
      hoursPerWeek: s.hoursPerWeek ?? null,
      classesRemaining: s.classesRemaining ?? 0,
      classesTotal: s.classesTotal ?? 0,
      version: s.version ?? null,
      upcomingClasses,
    };
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

  if (!studentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (useUnifiedProfile ? profileContext?.loading : studentLoading || upcomingLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!useUnifiedProfile && (studentError || upcomingError)) {
    logger.error("Error loading student status:", { studentError, upcomingError });
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{tc("loadFailed")}</Typography>;
  }

  if (!student) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.StudentManageStatus]}>
      <StudentStatusView student={student} isUpdating={isUpdating} onUpdateStatus={handleUpdateStatus} />
    </RequirePermission>
  );
}
