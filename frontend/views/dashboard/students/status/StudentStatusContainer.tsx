"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentByIdQueryDocument } from "@/frontend/graphql/sharedDocuments/student.documents";
import { changeStudentStatusMutationDocument } from "@/frontend/graphql/sharedDocuments/student-lifecycle.documents";
import { studentUpcomingClassesQueryDocument } from "@/frontend/graphql/sharedDocuments/student-status.documents";
import { StudentStatus } from "@/shared/lib/enum";
import { StudentStatusView } from "./StudentStatusView";
import type { StudentStatusPageData, UpcomingClassDisplay } from "./types";

export function StudentStatusContainer() {
  const t = useTranslations("dashboard.studentStatus");
  const params = useParams();
  const studentId = typeof params?.id === "string" ? params.id : "";
  const notifications = useNotifications();

  const {
    data: studentData,
    loading: studentLoading,
    error: studentError,
  } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const {
    data: upcomingData,
    loading: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useQuery(studentUpcomingClassesQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const [changeStatus, { loading: isUpdating }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: () => {
      notifications.show(t("successMessage"), {
        severity: "success",
        autoHideDuration: 5000,
      });
      void refetchUpcoming();
    },
    onError: error => {
      notifications.show(error.message, {
        severity: "error",
        autoHideDuration: 5000,
      });
    },
    refetchQueries: [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const student: StudentStatusPageData | null = useMemo(() => {
    const s = studentData?.studentById;
    const uc = upcomingData?.studentUpcomingClasses;
    if (!s?.id || !s.name) return null;

    const upcomingClasses: UpcomingClassDisplay[] = (uc?.classes ?? []).map(cls => ({
      id: cls?.id ?? "",
      instructor: cls?.instructor ?? "",
      scheduledStartAt: cls?.scheduledStartAt ?? "",
      scheduledEndAt: cls?.scheduledEndAt ?? "",
      durationMinutes: cls?.durationMinutes ?? 0,
      executionState: cls?.executionState ?? "NOT_ACTIVATED",
      isFrozen: cls?.isFrozen ?? false,
    }));

    return {
      id: s.id,
      name: s.name,
      status: (uc?.status ?? s.status ?? StudentStatus.REGULAR) as StudentStatus,
      avatarUrl: null,
      primaryTeacherId: s.primaryTeacherId ?? null,
      teacherName: s.teacherName ?? null,
      hoursPerWeek: s.hoursPerWeek ?? null,
      classesRemaining: s.classesRemaining ?? 0,
      classesTotal: s.classesTotal ?? 0,
      version: s.version ?? null,
      upcomingClasses,
    };
  }, [studentData, upcomingData]);

  const versionRef = useRef(student?.version ?? null);
  versionRef.current = student?.version ?? null;

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

  if (studentLoading || upcomingLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (studentError || upcomingError) {
    const msg = studentError?.message ?? upcomingError?.message ?? "Unknown error";
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{msg}</Typography>;
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
