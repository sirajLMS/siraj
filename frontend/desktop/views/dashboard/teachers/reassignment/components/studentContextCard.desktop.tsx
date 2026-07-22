// cspell:disable
"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { StudentContextCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { DesktopBaseCard, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";
import { useAppTranslation } from "@/shared/locale";

export function StudentContextCardDesktop({ student }: Readonly<StudentContextCardProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.studentContext;

  return (
    <DesktopBaseCard>
      <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
        <DesktopUserAvatar
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
          <DesktopStatusBadge category="studentAccount" status={student.accountStatus} label={student.accountStatus} />
        </Box>
      </Stack>
    </DesktopBaseCard>
  );
}
