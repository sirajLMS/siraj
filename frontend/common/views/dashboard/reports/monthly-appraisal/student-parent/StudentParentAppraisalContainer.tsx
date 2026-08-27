"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { CloseOutlined, SendOutlined } from "@mui/icons-material";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from "@mui/material";
import { useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  addAppraisalFeedbackMutationDocument,
  myMonthlyAppraisalQueryDocument,
  studentMonthlyAppraisalsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import type {
  AppraisalFeedbackEntry,
  AppraisalRubricField,
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

function extractRubricFields(
  a: {
    behaviorGrade: number | null;
    behaviorComment: string | null;
    attendanceGrade: number | null;
    attendanceComment: string | null;
    punctualityGrade: number | null;
    punctualityComment: string | null;
    overallGrade: number | null;
    overallComment: string | null;
  },
  labels: StudentParentAppraisalViewModel["labels"]
): readonly AppraisalRubricField[] {
  const fields: AppraisalRubricField[] = [
    { label: labels.studentParentView.rubricLabels.behavior, grade: a.behaviorGrade, comment: a.behaviorComment },
    { label: labels.studentParentView.rubricLabels.attendance, grade: a.attendanceGrade, comment: a.attendanceComment },
    {
      label: labels.studentParentView.rubricLabels.punctuality,
      grade: a.punctualityGrade,
      comment: a.punctualityComment,
    },
    { label: labels.studentParentView.rubricLabels.overall, grade: a.overallGrade, comment: a.overallComment },
  ];
  return fields.filter(f => f.grade !== null || (f.comment !== null && f.comment !== ""));
}

function mapFeedback(
  feedback:
    | ReadonlyArray<{
        id: string | null;
        body: string | null;
        authorName: string | null;
        createdAt: string | null;
      }>
    | null
    | undefined
): readonly AppraisalFeedbackEntry[] {
  if (!feedback) return [];
  return feedback.map(f => ({
    id: f.id ?? "",
    body: f.body ?? "",
    authorName: f.authorName,
    createdAt: f.createdAt ?? "",
  }));
}

/** Shared shape of an appraisal returned by either myMonthlyAppraisal or studentMonthlyAppraisals queries. */
type AppraisalQueryResult = {
  id: string | null;
  month: string | null;
  teacherId: string | null;
  behaviorGrade: number | null;
  behaviorComment: string | null;
  attendanceGrade: number | null;
  attendanceComment: string | null;
  punctualityGrade: number | null;
  punctualityComment: string | null;
  overallGrade: number | null;
  overallComment: string | null;
  learningTargets: string | null;
  feedback: ReadonlyArray<{
    id: string | null;
    body: string | null;
    authorName: string | null;
    createdAt: string | null;
  }> | null;
};

function mapAppraisal(a: AppraisalQueryResult, labels: StudentParentAppraisalViewModel["labels"]): MonthlyAppraisalRow {
  return {
    id: a.id ?? "",
    month: a.month ?? "",
    teacherId: a.teacherId ?? "",
    rubricFields: extractRubricFields(a, labels),
    learningTargets: a.learningTargets ?? "",
    feedback: mapFeedback(a.feedback),
  };
}

function buildStudentSelfAppraisals(
  data: AppraisalQueryResult | null | undefined,
  labels: StudentParentAppraisalViewModel["labels"]
): readonly MonthlyAppraisalRow[] {
  if (!data) return [];
  return [mapAppraisal(data, labels)];
}

function buildParentChildAppraisals(
  data: ReadonlyArray<AppraisalQueryResult> | null | undefined,
  labels: StudentParentAppraisalViewModel["labels"]
): readonly MonthlyAppraisalRow[] {
  if (!data) return [];
  return data.map(a => mapAppraisal(a, labels));
}

/**
 * Feedback modal rendered directly by the Container (not through the lazy tier view)
 * to ensure React state updates propagate to the Dialog `open` prop reliably.
 */
function ContainerFeedbackModal({
  labels,
  open,
  onClose,
  onSubmit,
  submitting,
  error,
}: Readonly<{
  labels: StudentParentAppraisalViewModel["labels"];
  open: boolean;
  onClose: () => void;
  onSubmit: (body: string) => void;
  submitting: boolean;
  error: string | null;
}>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {labels.studentParentView.feedbackModal.title}
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          label={labels.studentParentView.feedbackModal.bodyLabel}
          placeholder={labels.studentParentView.feedbackModal.bodyPlaceholder}
          id="appraisal-feedback-body-container"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {labels.studentParentView.feedbackModal.cancel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendOutlined />}
          disabled={submitting}
          onClick={() => {
            const el = document.getElementById("appraisal-feedback-body-container");
            const body = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value.trim() : "";
            if (body) onSubmit(body);
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.studentParentView.feedbackModal.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
    onCloseFeedbackModal: () => {
      setFeedbackModalOpen(false);
      setFeedbackError(null);
    },
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
        onClose={() => {
          setFeedbackModalOpen(false);
          setFeedbackError(null);
        }}
        onSubmit={onSubmitFeedback}
        submitting={feedbackSubmitting}
        error={feedbackError}
      />
    </>
  );
}
