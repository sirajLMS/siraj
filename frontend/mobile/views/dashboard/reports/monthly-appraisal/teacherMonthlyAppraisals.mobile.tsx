"use client";

import { CheckCircleOutlined, EditOutlined } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import type {
  MonthlyAppraisalStudentRow,
  MonthlyAppraisalTeacherViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/useTeacherMonthlyAppraisalsViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

const MONTH_OPTIONS = (() => {
  const now = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = -6; i <= 6; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: d.toISOString(),
      label: d.toLocaleDateString("en", { month: "short", year: "numeric" }),
    });
  }
  return opts;
})();

function MobileStudentRow({
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
    <ListItem key={student.id} disableGutters sx={{ mb: 1.5 }}>
      <Card variant="outlined" sx={{ width: "100%", borderRadius: 2 }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Avatar src={student.studentAvatarUrl ?? undefined} alt={student.name} sx={{ width: 40, height: 40 }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {student.name}
            </Typography>
            {hasAppraisal ? (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircleOutlined />}
                label={labels.teacherView.appraisalExists}
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={labels.teacherView.noAppraisalYet}
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onOpenForm(student.id)}
            aria-label={labels.teacherView.openForm}
          >
            <EditOutlined fontSize="small" />
          </IconButton>
        </CardContent>
      </Card>
    </ListItem>
  );
}

function MobileStudentList({
  students,
  labels,
  onOpenForm,
}: Readonly<{
  students: readonly MonthlyAppraisalStudentRow[];
  labels: MonthlyAppraisalTeacherViewModel["labels"];
  onOpenForm: (id: string) => void;
}>) {
  if (students.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.teacherView.noStudents}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <List disablePadding>
      {students.map(student => (
        <MobileStudentRow key={student.id} student={student} labels={labels} onOpenForm={onOpenForm} />
      ))}
    </List>
  );
}

export function TeacherMonthlyAppraisalsMobileView({
  labels,
  students,
  loading,
  selectedMonth,
  onMonthChange,
  onOpenForm,
  error,
}: Readonly<MonthlyAppraisalTeacherViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.teacherView.pageTitle} />

      <Box sx={{ mb: 2 }}>
        <InputLabel sx={theme => ({ mb: 0.5, fontSize: 13, color: theme.palette.text.secondary })}>
          {labels.teacherView.selectMonth}
        </InputLabel>
        <TextField select fullWidth size="small" value={selectedMonth} onChange={e => onMonthChange(e.target.value)}>
          {MONTH_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.errors.loadFailed}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <MobileStudentList students={students} labels={labels} onOpenForm={onOpenForm} />
      )}
    </MobilePageContainer>
  );
}
