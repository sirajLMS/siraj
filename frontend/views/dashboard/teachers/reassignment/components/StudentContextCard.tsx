"use client";

import { Avatar, Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard, StatusBadge } from "@/frontend/components/ui";
import type { StudentContextCardProps } from "../types";

export function StudentContextCard({ student }: Readonly<StudentContextCardProps>) {
  const t = useTranslations("dashboard.teacherReassignment.studentContext");

  return (
    <BaseCard>
      <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
        <Avatar
          src={student.avatarUrl || undefined}
          alt={student.name}
          sx={theme => ({
            width: 96,
            height: 96,
            border: `2px solid ${theme.palette.primary.main}`,
            borderRadius: 3,
          })}
        />
        <Box>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {student.name}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t("studentId", { id: student.id.replace("stu-", "SIR-") })}
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
              fontSize: "10px",
              display: "block",
              mb: 0.5,
            })}
          >
            {t("enrollment")}
          </Typography>
          <StatusBadge category="studentAccount" status={student.accountStatus} label={student.accountStatus} />
        </Box>
      </Stack>
    </BaseCard>
  );
}
