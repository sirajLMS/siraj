"use client";

import { RateReviewOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, CircularProgress, InputLabel, MenuItem, Stack, TextField } from "@mui/material";
import { DESKTOP_MONTH_OPTIONS } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/teacherMonthlyAppraisalConstants";
import type { MonthlyAppraisalTeacherViewModel } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/useTeacherMonthlyAppraisalsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { StudentList } from "@/frontend/desktop/views/dashboard/reports/monthly-appraisal/teacherMonthlyAppraisalStudents.parts";

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
