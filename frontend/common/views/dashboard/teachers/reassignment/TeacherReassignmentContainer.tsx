"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  changeStudentStatusMutationDocument,
  reassignStudentTeacherMutationDocument,
  studentByIdQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import {
  EMPTY_STUDENT,
  mapStudentData,
} from "@/frontend/common/views/dashboard/teachers/reassignment/teacherReassignmentContainer.helpers";
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

// The Container invokes the ViewModel unconditionally (Rules of Hooks) and
// renders loader/error states below the data-load hooks, handing the loaded
// `student` to the ViewModel once available.
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
  // The Container self-fetches its route params (useParams) and its data
  // (useQuery/useMutation) so the server-component page can render
  // `<TeacherReassignmentContainer />` with no props. The `_props` param is
  // retained only for callers that previously passed view-props (no current
  // caller does) and is intentionally ignored via the named-unused binding.
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

  // Invoke the ViewModel unconditionally (Rules of Hooks). Before the GraphQL
  // fetch resolves, `student` is null so the EMPTY_STUDENT sentinel is passed;
  // the loading/error early-returns below short-circuit rendering before the
  // view ever sees the sentinel.
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
