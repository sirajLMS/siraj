"use client";

import { useQuery } from "@apollo/client/react";
import { CheckCircleOutlined, DoNotDisturbOutlined } from "@mui/icons-material";
import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { teacherAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers";
import {
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface TeacherQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

interface StudentRowProps {
  readonly student: {
    readonly id: string | null;
    readonly name: string | null;
    readonly classesRemaining: number | null;
    readonly classesTotal: number | null;
  };
  readonly t: StudentQuotaLabels;
}

function StudentRow({ student, t }: Readonly<StudentRowProps>): ReactElement {
  const remaining = student.classesRemaining ?? 0;
  const total = student.classesTotal ?? 0;
  const eligible = remaining > 0;

  const eligibleBlock = eligible ? (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.5 }}>
      <CheckCircleOutlined sx={theme => ({ fontSize: 18, color: theme.palette.success.main })} />
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.success.main, fontWeight: 600 })}>
        {t.audience.eligibleForNextClass}
      </Typography>
    </Stack>
  ) : (
    <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.5 }}>
      <DoNotDisturbOutlined sx={theme => ({ fontSize: 18, color: theme.palette.error.main })} />
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.error.main, fontWeight: 600 })}>
        {t.audience.notEligibleForNextClass}
      </Typography>
    </Stack>
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack sx={{ gap: 1 }}>
        <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
            {student.name ?? t.common.notSet}
          </Typography>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {t.audience.remainingOfTotal(remaining, total)}
          </Typography>
        </Stack>
        {eligibleBlock}
      </Stack>
    </Paper>
  );
}

export function TeacherQuotaView({ t }: Readonly<TeacherQuotaViewProps>): ReactElement {
  const { data, loading } = useQuery(teacherAssignedStudentsQueryDocument);
  const students = data?.teacherAssignedStudents?.rows ?? [];

  if (loading) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (students.length === 0) {
    return <QuotaEmptyState message={t.audience.noData} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="titleLg">{t.audience.teacherTitle}</Typography>
      <Stack sx={{ gap: 1.5 }}>
        {students.map(student => (
          <StudentRow key={student.id ?? ""} student={student} t={t} />
        ))}
      </Stack>
    </Box>
  );
}
