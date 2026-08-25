"use client";

import { CheckCircleOutlined, EditOutlined, RateReviewOutlined } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { TeacherNoStudentsCard } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/TeacherNoStudentsCard";
import { DESKTOP_MONTH_OPTIONS } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/teacherMonthlyAppraisalConstants";
import type {
  MonthlyAppraisalStudentRow,
  MonthlyAppraisalTeacherViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/useTeacherMonthlyAppraisalsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function StudentRow({
  student,
  labels,
  onOpenForm,
}: Readonly<{
  student: MonthlyAppraisalStudentRow;
  labels: MonthlyAppraisalTeacherViewModel["labels"];
  onOpenForm: (id: string) => void;
}>) {
  const hasAppraisal = Boolean(student.appraisalForMonth);
  return (
    <Card variant="outlined" sx={{ transition: "box-shadow 0.2s", "&:hover": { boxShadow: 3 } }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
        <Avatar src={student.studentAvatarUrl ?? undefined} alt={student.name} sx={{ width: 48, height: 48 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
            {student.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center" }}>
            {hasAppraisal ? (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircleOutlined />}
                label={labels.teacherView.appraisalExists}
              />
            ) : (
              <Chip size="small" color="warning" variant="outlined" label={labels.teacherView.noAppraisalYet} />
            )}
          </Stack>
        </Box>
        <Button
          variant={hasAppraisal ? "outlined" : "contained"}
          color="primary"
          startIcon={<EditOutlined />}
          onClick={() => onOpenForm(student.id)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.teacherView.openForm}
        </Button>
      </CardContent>
    </Card>
  );
}

function StudentList({
  students,
  labels,
  onOpenForm,
}: Readonly<{
  students: readonly MonthlyAppraisalStudentRow[];
  labels: MonthlyAppraisalTeacherViewModel["labels"];
  onOpenForm: (id: string) => void;
}>) {
  if (students.length === 0) {
    return <TeacherNoStudentsCard message={labels.teacherView.noStudents} />;
  }
  return (
    <Stack spacing={2}>
      {students.map(student => (
        <StudentRow key={student.id} student={student} labels={labels} onOpenForm={onOpenForm} />
      ))}
    </Stack>
  );
}

export function TeacherMonthlyAppraisalsDesktopView({
  labels,
  students,
  loading,
  selectedMonth,
  onMonthChange,
  onOpenForm,
  error,
}: Readonly<MonthlyAppraisalTeacherViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.teacherView.pageTitle} subtitle={labels.teacherView.pageSubtitle} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3, alignItems: { md: "center" } }}>
        <Box sx={{ minWidth: 240 }}>
          <InputLabel sx={theme => ({ mb: 0.5, fontSize: 13, color: theme.palette.text.secondary })}>
            {labels.teacherView.selectMonth}
          </InputLabel>
          <TextField select fullWidth size="small" value={selectedMonth} onChange={e => onMonthChange(e.target.value)}>
            {DESKTOP_MONTH_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          icon={<RateReviewOutlined />}
          label={`${students.length} ${students.length === 1 ? "student" : "students"}`}
          color="primary"
          variant="outlined"
        />
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.errors.loadFailed}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <StudentList students={students} labels={labels} onOpenForm={onOpenForm} />
      )}
    </DesktopPageContainer>
  );
}
