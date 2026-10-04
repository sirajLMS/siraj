"use client";

import { Star, StarBorderOutlined } from "@mui/icons-material";
import { Alert, Box, Divider, Rating, Stack, TextField, Typography } from "@mui/material";
import {
  type AppraisalFormData,
  RUBRIC_FIELDS,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.constants";
import type { MonthlyAppraisalLabels } from "@/shared/locale";

function RubricField({
  label,
  commentPlaceholder,
  grade,
  comment,
  onGradeChange,
  onCommentChange,
}: Readonly<{
  label: string;
  commentPlaceholder: string;
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
        placeholder={commentPlaceholder}
        value={comment}
        onChange={e => onCommentChange(e.target.value)}
        sx={{ mt: 0.5 }}
      />
    </Box>
  );
}

export function AppraisalFormFields({
  formLabels,
  formData,
  error,
  onGradeChange,
  onCommentChange,
}: Readonly<{
  formLabels: MonthlyAppraisalLabels["form"];
  formData: AppraisalFormData;
  error: string | null;
  onGradeChange: (key: keyof AppraisalFormData, value: number | null) => void;
  onCommentChange: (key: keyof AppraisalFormData, value: string) => void;
}>) {
  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {RUBRIC_FIELDS.map(field => (
        <RubricField
          key={field.key}
          label={formLabels.rubric[field.labelKey]}
          commentPlaceholder={formLabels.rubric.commentPlaceholder}
          grade={formData[field.gradeKey]}
          comment={formData[field.commentKey]}
          onGradeChange={v => onGradeChange(field.gradeKey, v)}
          onCommentChange={v => onCommentChange(field.commentKey, v)}
        />
      ))}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {`${formLabels.learningTargets} *`}
        </Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          rows={3}
          placeholder={formLabels.learningTargetsPlaceholder}
          value={formData.learningTargets}
          onChange={e => onCommentChange("learningTargets", e.target.value)}
          required
          error={!formData.learningTargets.trim() && error !== null}
        />
      </Box>
    </>
  );
}
