// cspell:disable
"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { StudentContextCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { useAppTranslation } from "@/shared/locale";

export function StudentContextCardMobile({ student }: Readonly<StudentContextCardProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.studentContext;

  return (
    <MobileBaseCard>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <MobileUserAvatar
          src={student.avatarUrl}
          label={student.name}
          size={80}
          variant="rounded"
          sx={theme => ({
            border: `2px solid ${theme.palette.primary.main}`,
            borderRadius: 3,
          })}
        />
        <Box>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {student.name}
          </Typography>
        </Box>

        <Box
          sx={theme => ({
            width: "100%",
            p: 1,
            backgroundColor: theme.palette.surfaceContainerLow,
            borderRadius: 2,
            textAlign: "left",
          })}
        >
          <Typography
            variant="labelSm"
            sx={theme => ({
              color: theme.palette.onSurfaceVariant,
              display: "block",
              mb: 0.5,
            })}
          >
            {t.enrollment}
          </Typography>
          <MobileStatusBadge category="studentAccount" status={student.accountStatus} label={student.accountStatus} />
        </Box>
      </Stack>
    </MobileBaseCard>
  );
}
