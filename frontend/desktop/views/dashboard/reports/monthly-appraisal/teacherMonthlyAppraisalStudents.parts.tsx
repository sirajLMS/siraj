"use client";

import { CheckCircleOutlined, EditOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { TeacherNoStudentsCard } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/TeacherNoStudentsCard";
import type {
  MonthlyAppraisalStudentRow,
  MonthlyAppraisalTeacherViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/useTeacherMonthlyAppraisalsViewModel";

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
    <Card
      variant="outlined"
      sx={theme => ({
        transition: theme.transitions.create(["box-shadow", "border-color", "background-color"]),
        "&:hover": {
          boxShadow: 3,
          borderColor: hasAppraisal ? theme.palette.success.light : theme.palette.primary.light,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        },
      })}
    >
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
        <Avatar
          src={student.studentAvatarUrl ?? undefined}
          alt={student.name}
          sx={theme => ({
            width: 44,
            height: 44,
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            color: theme.palette.primary.main,
            fontWeight: 600,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          {student.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
            {student.name}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            {hasAppraisal ? (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircleOutlined />}
                label={labels.teacherView.appraisalExists}
                sx={{ borderRadius: 2, px: 0.5, py: 0.25 }}
              />
            ) : (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={labels.teacherView.noAppraisalYet}
                sx={{ borderRadius: 2, px: 0.5, py: 0.25 }}
              />
            )}
          </Box>
        </Box>
        <Button
          variant={hasAppraisal ? "outlined" : "contained"}
          color="primary"
          startIcon={<EditOutlined />}
          onClick={() => onOpenForm(student.id)}
          sx={theme => ({
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 2,
            py: 1,
            "&:hover": { transform: "translateY(-1px)" },
            transition: theme.transitions.create("transform"),
          })}
        >
          {labels.teacherView.openForm}
        </Button>
      </CardContent>
    </Card>
  );
}

interface StudentListProps {
  readonly students: readonly MonthlyAppraisalStudentRow[];
  readonly labels: MonthlyAppraisalTeacherViewModel["labels"];
  readonly onOpenForm: (id: string) => void;
}

/** Roster of the teacher's students with per-student appraisal state and form shortcut. */
export function StudentList({ students, labels, onOpenForm }: Readonly<StudentListProps>) {
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
