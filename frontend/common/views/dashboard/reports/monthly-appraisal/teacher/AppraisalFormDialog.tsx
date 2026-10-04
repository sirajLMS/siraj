"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Dialog, DialogContent } from "@mui/material";
import { useState } from "react";
import {
  studentAppraisalDetailForFormQueryDocument,
  submitMonthlyAppraisalMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  AppraisalDialogActions,
  AppraisalDialogHeader,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalDialogChrome.parts";
import type {
  AppraisalFormData,
  AppraisalInitialGrades,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.constants";
import {
  buildInitialFormData,
  buildSubmitAppraisalInput,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.helpers";
import { AppraisalFormFields } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormFields.parts";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

interface AppraisalFormDialogProps {
  open: boolean;
  studentId: string;
  studentName: string;
  month: string;
  initialGrades?: AppraisalInitialGrades | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export function AppraisalFormDialog({
  open,
  studentId,
  studentName,
  month,
  initialGrades,
  onClose,
  onSubmitted,
}: Readonly<AppraisalFormDialogProps>) {
  const { data: existingData } = useQuery(studentAppraisalDetailForFormQueryDocument, {
    variables: { studentId },
    skip: !open || !studentId,
    fetchPolicy: "cache-and-network",
  });
  const existingAppraisal = existingData?.studentMonthlyAppraisals?.[0];
  const t = useAppTranslation(Translation.Dashboard.MonthlyAppraisal);
  const locale = useAppLocale();

  const [formData, setFormData] = useState<AppraisalFormData>(() =>
    buildInitialFormData({ studentId, studentName, month, initialGrades, existingAppraisal })
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [submitAppraisal] = useMutation(submitMonthlyAppraisalMutationDocument);

  const updateGrade = (key: keyof AppraisalFormData, value: number | null) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  const updateComment = (key: keyof AppraisalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!formData.learningTargets.trim()) {
      setError(t.form.learningTargetsRequired);
      return;
    }
    if (!studentId) {
      setError(t.errors.monthRequired);
      return;
    }
    setError(null);
    setSubmitting(true);
    void submitAppraisal({
      variables: { input: buildSubmitAppraisalInput(formData, studentId, month) },
      onCompleted: () => {
        setSubmitting(false);
        onSubmitted();
        onClose();
      },
      onError: err => {
        setSubmitting(false);
        setError(err.message);
      },
    });
  };

  const monthLabel = new Date(month).toLocaleDateString(locale, { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <AppraisalDialogHeader
        studentName={studentName}
        monthLabel={monthLabel}
        subtitle={t.form.subtitle}
        onClose={onClose}
      />
      <DialogContent>
        <AppraisalFormFields
          formLabels={t.form}
          formData={formData}
          error={error}
          onGradeChange={updateGrade}
          onCommentChange={updateComment}
        />
      </DialogContent>
      <AppraisalDialogActions
        cancelLabel={t.form.cancel}
        submitLabel={t.form.submit}
        submitting={submitting}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
