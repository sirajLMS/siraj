"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, type StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import {
  changeStudentStatusMutationDocument,
  reassignStudentTeacherMutationDocument,
  studentByIdQueryDocument,
  teachersQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/views/dashboard/admin/parents/students/types";
import { TeacherReassignmentView } from "@/frontend/views/dashboard/teachers/reassignment/TeacherReassignmentView";
import type {
  ReassignmentStudentData,
  ReassignmentSubmitInput,
  ReassignmentTeacherOption,
  StatusChangeInput,
} from "@/frontend/views/dashboard/teachers/reassignment/types";
import { useRouter } from "@/shared/i18n/routing";

type StudentQueryData = Operations.StudentByIdQuery;
type TeachersQueryData = Operations.TeachersQuery;

function mapStudentData(studentData: StudentQueryData | undefined): ReassignmentStudentData | null {
  const s = studentData?.studentById;
  if (!s?.id || !s.name || !s.status) return null;
  const status = s.status as StudentStatus;
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
}

function mapTeacherOptions(teachersData: TeachersQueryData | undefined): readonly ReassignmentTeacherOption[] {
  return (teachersData?.teachers ?? [])
    .filter(
      (t): t is { readonly id: string; readonly name: string } => typeof t.id === "string" && typeof t.name === "string"
    )
    .map(t => ({
      id: t.id,
      name: t.name,
      avatarUrl: "",
      status: "active" as const,
    }));
}

function ReassignmentLoadingState() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress />
    </Box>
  );
}

function ReassignmentErrorState({ message }: { readonly message: string }) {
  return <Typography sx={{ color: theme => theme.palette.error.main }}>{message}</Typography>;
}

export function TeacherReassignmentContainer() {
  const t = useTranslations("dashboard.teacherReassignment");
  const tc = useTranslations("common");
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
      notifications.show(t("actions.reassignSuccess"), { severity: "success", autoHideDuration: 4000 });
    },
    onError: mutationError => {
      logger.error("Teacher reassignment failed:", { mutationError });
      notifications.show(tc("operationFailed"), { severity: "error", autoHideDuration: 5000 });
    },
    refetchQueries: [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const [changeStatus, { loading: isChangingStatus }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: () => {
      notifications.show(t("actions.statusChangeSuccess"), { severity: "success", autoHideDuration: 4000 });
    },
    onError: mutationError => {
      logger.error("Student status change failed:", { mutationError });
      notifications.show(tc("operationFailed"), { severity: "error", autoHideDuration: 5000 });
    },
    refetchQueries: [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const student: ReassignmentStudentData | null = useMemo(() => mapStudentData(studentData), [studentData]);

  const teachers: readonly ReassignmentTeacherOption[] = useMemo(() => mapTeacherOptions(teachersData), [teachersData]);

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
    return <ReassignmentErrorState message={t("errors.invalidId")} />;
  }

  if (studentLoading || teachersLoading) {
    return <ReassignmentLoadingState />;
  }

  if (studentError || teachersError) {
    logger.error("Error loading teacher reassignment data:", { studentError, teachersError });
    return <ReassignmentErrorState message={tc("loadFailed")} />;
  }

  if (!student) {
    return <ReassignmentErrorState message={t("errors.invalidId")} />;
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
