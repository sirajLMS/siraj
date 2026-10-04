"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  addAppraisalFeedbackMutationDocument,
  myMonthlyAppraisalQueryDocument,
  studentMonthlyAppraisalsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  buildParentChildAppraisals,
  buildStudentSelfAppraisals,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/StudentParentAppraisalContainer.helpers";
import { ContainerFeedbackModal } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/StudentParentAppraisalContainer.parts";
import type {
  MonthlyAppraisalRow,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";
import { useAppTranslation } from "@/shared/locale/client/use-app-translation";
import { Translation } from "@/shared/locale/namespaces/translation";

const lazyViews = createLazyView<StudentParentAppraisalViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/reports/monthly-appraisal/studentParentAppraisals.mobile").then(m => ({
      default: m.StudentParentAppraisalsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/reports/monthly-appraisal/studentParentAppraisals.desktop").then(m => ({
      default: m.StudentParentAppraisalsDesktopView,
    }))
);

export interface StudentParentAppraisalContainerProps {
  /** When provided, shows this student's appraisals (parent view). When null, shows the viewer's own (student view). */
  readonly studentId?: string | null;
}

export function StudentParentAppraisalContainer({ studentId }: Readonly<StudentParentAppraisalContainerProps>) {
  const labels = useAppTranslation(Translation.Dashboard.MonthlyAppraisal);
  const [selectedAppraisalId, setSelectedAppraisalId] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const isStudentSelfView = !studentId;

  const myQuery = useQuery(myMonthlyAppraisalQueryDocument, {
    variables: { month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString() },
    fetchPolicy: "cache-and-network",
    skip: !isStudentSelfView,
  });

  const parentQuery = useQuery(studentMonthlyAppraisalsQueryDocument, {
    variables: { studentId: studentId ?? "" },
    fetchPolicy: "cache-and-network",
    skip: isStudentSelfView,
  });

  const loading = isStudentSelfView ? myQuery.loading : parentQuery.loading;
  const error = isStudentSelfView ? Boolean(myQuery.error) : Boolean(parentQuery.error);

  const appraisals: readonly MonthlyAppraisalRow[] = isStudentSelfView
    ? buildStudentSelfAppraisals(myQuery.data?.myMonthlyAppraisal, labels)
    : buildParentChildAppraisals(parentQuery.data?.studentMonthlyAppraisals, labels);

  const [submitFeedback, { loading: feedbackSubmitting }] = useMutation(addAppraisalFeedbackMutationDocument);

  const closeFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setFeedbackError(null);
  };

  const onSubmitFeedback = (body: string) => {
    if (!selectedAppraisalId) return;
    setFeedbackError(null);
    void submitFeedback({
      variables: { input: { appraisalId: selectedAppraisalId, body } },
      onCompleted: () => {
        setFeedbackModalOpen(false);
        const refetch = isStudentSelfView ? myQuery.refetch : parentQuery.refetch;
        void refetch();
      },
      onError: err => {
        setFeedbackError(err.message);
      },
    });
  };

  const viewModel: StudentParentAppraisalViewModel = {
    labels,
    appraisals,
    loading,
    error,
    selectedAppraisalId,
    onSelectAppraisal: setSelectedAppraisalId,
    feedbackModalOpen,
    onOpenFeedbackModal: () => setFeedbackModalOpen(true),
    onCloseFeedbackModal: closeFeedbackModal,
    onSubmitFeedback,
    feedbackSubmitting,
    feedbackError,
  };

  return (
    <>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
      <ContainerFeedbackModal
        labels={labels}
        open={feedbackModalOpen}
        onClose={closeFeedbackModal}
        onSubmit={onSubmitFeedback}
        submitting={feedbackSubmitting}
        error={feedbackError}
      />
    </>
  );
}
