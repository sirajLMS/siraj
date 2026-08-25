"use client";

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { CloseOutlined, SaveOutlined, Star, StarBorderOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { submitMonthlyAppraisalMutationDocument } from "@/frontend/common/graphql/sharedDocuments";

interface ExistingAppraisal {
  behaviorGrade: number | null;
  behaviorComment: string | null;
  attendanceGrade: number | null;
  attendanceComment: string | null;
  punctualityGrade: number | null;
  punctualityComment: string | null;
  overallGrade: number | null;
  overallComment: string | null;
  learningTargets: string;
}

const STUDENT_APPRAISAL_DETAIL_QUERY: TypedDocumentNode<{ studentMonthlyAppraisals: ExistingAppraisal[] | null }> = gql`
  query StudentAppraisalDetailForForm($studentId: String!) {
    studentMonthlyAppraisals(studentId: $studentId) {
      id
      behaviorGrade
      behaviorComment
      attendanceGrade
      attendanceComment
      punctualityGrade
      punctualityComment
      overallGrade
      overallComment
      learningTargets
    }
  }
`;

interface AppraisalFormData {
  studentId: string;
  studentName: string;
  month: string;
  behaviorGrade: number | null;
  behaviorComment: string;
  attendanceGrade: number | null;
  attendanceComment: string;
  punctualityGrade: number | null;
  punctualityComment: string;
  overallGrade: number | null;
  overallComment: string;
  learningTargets: string;
}

interface AppraisalFormDialogProps {
  open: boolean;
  studentId: string;
  studentName: string;
  month: string;
  initialGrades?: {
    behaviorGrade: number | null;
    behaviorComment: string;
    attendanceGrade: number | null;
    attendanceComment: string;
    punctualityGrade: number | null;
    punctualityComment: string;
    overallGrade: number | null;
    overallComment: string;
    learningTargets: string;
  } | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const RUBRIC_FIELDS = [
  { key: "behavior", label: "Behavior", gradeKey: "behaviorGrade", commentKey: "behaviorComment" },
  { key: "attendance", label: "Attendance", gradeKey: "attendanceGrade", commentKey: "attendanceComment" },
  { key: "punctuality", label: "Punctuality", gradeKey: "punctualityGrade", commentKey: "punctualityComment" },
  { key: "overall", label: "Overall Appraisal", gradeKey: "overallGrade", commentKey: "overallComment" },
] as const;

function RubricField({
  label,
  grade,
  comment,
  onGradeChange,
  onCommentChange,
}: Readonly<{
  label: string;
  grade: number | null;
  comment: string;
  onGradeChange: (value: number | null) => void;
  onCommentChange: (value: string) => void;
}>) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Rating
          value={grade}
          onChange={(_, newValue) => onGradeChange(newValue)}
          max={5}
          size="small"
          emptyIcon={<StarBorderOutlined fontSize="inherit" />}
          icon={<Star fontSize="inherit" />}
        />
      </Stack>
      <TextField
        fullWidth
        size="small"
        multiline
        rows={2}
        placeholder="Optional comment..."
        value={comment}
        onChange={e => onCommentChange(e.target.value)}
        sx={{ mt: 0.5 }}
      />
    </Box>
  );
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
  const { data: existingData } = useQuery(STUDENT_APPRAISAL_DETAIL_QUERY, {
    variables: { studentId },
    skip: !open || !studentId,
    fetchPolicy: "cache-and-network",
  });
  const existingAppraisal = existingData?.studentMonthlyAppraisals?.[0];

  const [formData, setFormData] = useState<AppraisalFormData>({
    studentId,
    studentName,
    month,
    behaviorGrade: initialGrades?.behaviorGrade ?? existingAppraisal?.behaviorGrade ?? null,
    behaviorComment: initialGrades?.behaviorComment ?? existingAppraisal?.behaviorComment ?? "",
    attendanceGrade: initialGrades?.attendanceGrade ?? existingAppraisal?.attendanceGrade ?? null,
    attendanceComment: initialGrades?.attendanceComment ?? existingAppraisal?.attendanceComment ?? "",
    punctualityGrade: initialGrades?.punctualityGrade ?? existingAppraisal?.punctualityGrade ?? null,
    punctualityComment: initialGrades?.punctualityComment ?? existingAppraisal?.punctualityComment ?? "",
    overallGrade: initialGrades?.overallGrade ?? existingAppraisal?.overallGrade ?? null,
    overallComment: initialGrades?.overallComment ?? existingAppraisal?.overallComment ?? "",
    learningTargets: initialGrades?.learningTargets ?? existingAppraisal?.learningTargets ?? "",
  });
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
      setError("Learning targets are required.");
      return;
    }
    if (!studentId) {
      setError("Student ID is missing.");
      return;
    }
    setError(null);
    setSubmitting(true);
    void submitAppraisal({
      variables: {
        input: {
          studentId: studentId,
          month: month,
          behaviorGrade: formData.behaviorGrade,
          behaviorComment: formData.behaviorComment || null,
          attendanceGrade: formData.attendanceGrade,
          attendanceComment: formData.attendanceComment || null,
          punctualityGrade: formData.punctualityGrade,
          punctualityComment: formData.punctualityComment || null,
          overallGrade: formData.overallGrade,
          overallComment: formData.overallComment || null,
          learningTargets: formData.learningTargets,
        },
      },
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

  const monthLabel = new Date(month).toLocaleDateString("en", { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6">
            {studentName} — {monthLabel}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
            Grades 1-5 (optional) · Learning targets required
          </Typography>
        </Box>
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
        {RUBRIC_FIELDS.map(field => (
          <RubricField
            key={field.key}
            label={field.label}
            grade={formData[field.gradeKey]}
            comment={formData[field.commentKey]}
            onGradeChange={v => updateGrade(field.gradeKey, v)}
            onCommentChange={v => updateComment(field.commentKey, v)}
          />
        ))}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Learning Targets *
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="Describe the learning targets for next month..."
            value={formData.learningTargets}
            onChange={e => updateComment("learningTargets", e.target.value)}
            required
            error={!formData.learningTargets.trim() && error !== null}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveOutlined />}
          disabled={submitting}
          onClick={handleSubmit}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Save Appraisal
        </Button>
      </DialogActions>
    </Dialog>
  );
}
