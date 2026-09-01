"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { type StudentByIdQuery, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  changeStudentStatusMutationDocument,
  reassignStudentTeacherMutationDocument,
  studentByIdQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type {
  ReassignmentStudentData,
  ReassignmentSubmitInput,
  StatusChangeInput,
  TeacherReassignmentViewProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import {
  type TeacherReassignmentViewModel,
  type UseTeacherReassignmentViewModelProps,
  useTeacherReassignmentCoordinatorLabels,
  useTeacherReassignmentViewModel,
} from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { useRouter } from "@/shared/i18n/navigation";

// NEW FOR PLAN v5: Container invokes the ViewModel unconditionally (Rules of
// Hooks — biome's `useHookAtTopLevel` enforces that). Below the data-load
// hooks, the Container renders the loader/error states and otherwise hands
// the loaded `student` to the VM.
const EMPTY_STUDENT: ReassignmentStudentData = {
  id: "",
  name: "",
  avatarUrl: null,
  accountStatus: "deactivated",
  status: StudentStatus.Regular,
  primaryTeacherId: null,
  teacherName: null,
  version: null,
  updatedAt: null,
};

type StudentQueryData = StudentByIdQuery;

function mapStudentData(studentData: StudentQueryData | undefined): ReassignmentStudentData | null {
  const s = studentData?.studentById;
  if (!s?.id || !s.name || !s.status) return null;
  const status = s.status;
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

const lazyViews = createLazyView<TeacherReassignmentViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/reassignment/teacherReassignmentView.mobile").then(m => ({
      default: m.TeacherReassignmentViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/reassignment/teacherReassignmentView.desktop").then(m => ({
      default: m.TeacherReassignmentViewDesktop,
    }))
);

type TeacherReassignmentContainerProps = Readonly<Partial<UseTeacherReassignmentViewModelProps>>;

export function TeacherReassignmentContainer(_props: TeacherReassignmentContainerProps = {}) {
  // NEW FOR PLAN v5: per specs.md §6.1 the Container self-fetches its params
  // (useParams) and its data (useQuery/useMutation) so the server-component
  // page.tsx may render `<TeacherReassignmentContainer />` with no props.
  // The `_props` param is retained only for callers that previously passed
  // view-props (no current caller does); it's intentionally ignored via the
  // named-unused binding below.
  const { labels: reassignmentLabels, common: commonLabels } = useTeacherReassignmentCoordinatorLabels();
  const params = useParams();
  const studentId = typeof params?.id === "string" ? params.id : "";
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

  const [reassignTeacher, { loading: isReassigning }] = useMutation(reassignStudentTeacherMutationDocument, {
    onCompleted: () => {
      notifications.show(reassignmentLabels.actions.reassignSuccess, { severity: "success", autoHideDuration: 4000 });
    },
    onError: mutationError => {
      logger.error("Teacher reassignment failed:", { mutationError });
      notifications.show(commonLabels.operationFailed, { severity: "error", autoHideDuration: 5000 });
    },
    refetchQueries: [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const [changeStatus, { loading: isChangingStatus }] = useMutation(changeStudentStatusMutationDocument, {
    onCompleted: () => {
      notifications.show(reassignmentLabels.actions.statusChangeSuccess, {
        severity: "success",
        autoHideDuration: 4000,
      });
    },
    onError: mutationError => {
      logger.error("Student status change failed:", { mutationError });
      notifications.show(commonLabels.operationFailed, { severity: "error", autoHideDuration: 5000 });
    },
    refetchQueries: [{ query: studentByIdQueryDocument, variables: { studentId } }],
  });

  const student: ReassignmentStudentData | null = useMemo(() => mapStudentData(studentData), [studentData]);

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

  // NEW FOR PLAN v5: invoke the ViewModel unconditionally (Rules of Hooks —
  // biome's `useHookAtTopLevel` enforces no early-return before hook calls).
  // Before the GraphQL fetch resolves, `student` is null so we pass the
  // EMPTY_STUDENT sentinel; the loading/error early-returns below short-
  // circuit rendering before the view ever sees the sentinel.
  const viewModelProps: Readonly<TeacherReassignmentViewProps> = {
    student: student ?? EMPTY_STUDENT,
    currentTeacherName: student?.teacherName ?? "Unset",
    isSubmitting: isReassigning || isChangingStatus,
    onReassign: handleReassign,
    onStatusChange: handleStatusChange,
    onCancel: handleCancel,
  };

  const viewModel = useTeacherReassignmentViewModel(viewModelProps);

  if (!studentId) {
    return <ErrorState message={reassignmentLabels.errors.invalidId} />;
  }

  if (studentLoading) {
    return <LoadingState />;
  }

  if (studentError) {
    logger.error("Error loading teacher reassignment data:", { studentError });
    return <ErrorState message={commonLabels.loadFailed} />;
  }

  if (!student) {
    return <ErrorState message={reassignmentLabels.errors.invalidId} />;
  }

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
