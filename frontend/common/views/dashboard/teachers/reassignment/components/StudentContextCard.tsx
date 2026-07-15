"use client";

import { Box, Stack, Typography } from "@mui/material";
import { BaseCard, StatusBadge, UserAvatar } from "@/frontend/common/components/ui";
import type { StudentContextCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { useAppTranslation } from "@/shared/locale/client";

export function StudentContextCard({ student }: Readonly<StudentContextCardProps>) {
  const t = useAppTranslation("dashboard.teacherReassignment").studentContext;

  return (
    <BaseCard>
      <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
        <UserAvatar
          src={student.avatarUrl}
          label={student.name}
          size={96}
          variant="rounded"
          sx={theme => ({
            border: `2px solid ${theme.palette.primary.main}`,
            borderRadius: 3,
          })}
        />
        <Box>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {student.name}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t.studentId(student.id.replace("stu-", "SIR-"))}
          </Typography>
        </Box>

        <Box
          sx={theme => ({
            width: "100%",
            p: 1.5,
            backgroundColor: theme.palette.surfaceContainerLow,
            borderRadius: 2,
            textAlign: "left",
          })}
        >
          <Typography
            variant="labelUppercase"
            sx={theme => ({
              color: theme.palette.onSurfaceVariant,
              display: "block",
              mb: 0.5,
            })}
          >
            {t.enrollment}
          </Typography>
          <StatusBadge category="studentAccount" status={student.accountStatus} label={student.accountStatus} />
        </Box>
      </Stack>
    </BaseCard>
  );
}
