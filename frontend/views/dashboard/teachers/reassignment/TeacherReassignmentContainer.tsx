"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentByIdQueryDocument } from "@/frontend/graphql/sharedDocuments/student.documents";
import {
  changeStudentStatusMutationDocument,
  reassignStudentTeacherMutationDocument,
} from "@/frontend/graphql/sharedDocuments/student-lifecycle.documents";
import { teachersQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher.documents";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/views/dashboard/students/home/types";
import { useRouter } from "@/shared/i18n/routing";
import { StudentStatus } from "@/shared/lib/enum";
import { TeacherReassignmentView } from "./TeacherReassignmentView";
import type {
  ReassignmentStudentData,
  ReassignmentSubmitInput,
  ReassignmentTeacherOption,
  StatusChangeInput,
} from "./types";

export function TeacherReassignmentContainer() {
  const t = useTranslations("dashboard.teacherReassignment");
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? "";
  const notifications = useNotifications();
  const router = useRouter();

  const {
    data: studentData,
    loading: studentLoading,
    error: studentError,
  } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useQuery(teachersQueryDocument, {
    variables: { search: "", limit: 100 },
  });

  const [reassignTeacher, { loading: isReassigning }] = useMutation(reassignStudentTeacherMutationDocument, {
    onCompleted: () => {
      notifications.show(t("actions.submit"), { severity: "success", autoHideDuration: 4000 });
    },
    onError: mutationError => {
      notifications.show(mutationError.message, { severity: "error", autoHideDuration: 5000 });
    },
    refetchQueries: [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const [changeStatus, { loading: isChangingStatus }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: () => {
      notifications.show(t("actions.submit"), { severity: "success", autoHideDuration: 4000 });
    },
    onError: mutationError => {
      notifications.show(mutationError.message, { severity: "error", autoHideDuration: 5000 });
    },
    refetchQueries: [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const student: ReassignmentStudentData | null = useMemo(() => {
    const s = studentData?.studentById;
    if (!s?.id || !s.name) return null;
    const status = (s.status ?? StudentStatus.REGULAR) as StudentStatus;
    return {
      id: s.id,
      name: s.name,
      avatarUrl: null,
      accountStatus: STUDENT_STATUS_TO_ACCOUNT_STATUS[status],
      status,
      primaryTeacherId: s.primaryTeacherId ?? null,
      teacherName: s.teacherName ?? null,
      version: s.version ?? null,
      updatedAt: s.updatedAt ?? null,
    };
  }, [studentData]);

  const teachers: readonly ReassignmentTeacherOption[] = useMemo(
    () =>
      (teachersData?.teachers ?? [])
        .filter(
          (t): t is { readonly id: string; readonly name: string } =>
            typeof t.id === "string" && typeof t.name === "string"
        )
        .map(t => ({
          id: t.id,
          name: t.name,
          avatarUrl: "",
          status: "active" as const,
        })),
    [teachersData]
  );

  const versionRef = useRef(student?.version ?? null);
  useEffect(() => {
    versionRef.current = student?.version ?? null;
  }, [student?.version]);

  const handleReassign = useCallback(
    async (input: ReassignmentSubmitInput) => {
      await reassignTeacher({
        variables: {
          studentId: input.studentId,
          newTeacherId: input.newTeacherId,
          expectedVersion: input.expectedVersion ?? versionRef.current,
        },
      });
    },
    [reassignTeacher]
  );

  const handleStatusChange = useCallback(
    async (input: StatusChangeInput) => {
      await changeStatus({
        variables: {
          studentId: input.studentId,
          newStatus: input.newStatus,
          expectedVersion: input.expectedVersion ?? versionRef.current,
        },
      });
    },
    [changeStatus]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (!studentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (studentLoading || teachersLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (studentError || teachersError) {
    const msg = studentError?.message ?? teachersError?.message ?? "Unknown error";
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{msg}</Typography>;
  }

  if (!student) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.StudentReassignTeacher, AppPermission.StudentManageStatus]}>
      <TeacherReassignmentView
        student={student}
        currentTeacherName={student.teacherName ?? "Unset"}
        teachers={teachers}
        isSubmitting={isReassigning || isChangingStatus}
        onReassign={handleReassign}
        onStatusChange={handleStatusChange}
        onCancel={handleCancel}
      />
    </RequirePermission>
  );
}
