// cspell:disable
"use client";

import { AssignmentIndOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { CurrentTeacherCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { useAppTranslation } from "@/shared/locale";

export function CurrentTeacherCardMobile({ currentTeacherName, teacherId }: Readonly<CurrentTeacherCardProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherReassignment.currentTeacher;

  return (
    <MobileBaseCard
      sx={theme => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
        position: "relative",
        overflow: "hidden",
        boxShadow: theme.palette.shadow.card,
        border: "none",
        ...(teacherId
          ? {
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
              transition: "opacity 0.2s",
            }
          : {}),
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1, p: 2 }}>
        <Typography
          variant="labelUppercase"
          sx={theme => ({
            mb: 0.5,
            opacity: 0.9,
            color: theme.palette.onPrimary,
          })}
        >
          {t.title}
        </Typography>
        <Typography
          variant="titleLg"
          sx={theme => ({
            fontWeight: 700,
            mb: 1,
            color: theme.palette.onPrimary,
          })}
        >
          {currentTeacherName || t.unset}
        </Typography>
        <Typography
          variant="labelSm"
          sx={theme => ({
            opacity: 0.8,
            lineHeight: 1.4,
            color: theme.palette.onPrimary,
          })}
        >
          {t.notice}
        </Typography>
      </Box>
      <AssignmentIndOutlined
        sx={theme => ({
          position: "absolute",
          right: -12,
          bottom: -12,
          fontSize: 96,
          opacity: 0.1,
          color: theme.palette.onPrimary,
        })}
      />
    </MobileBaseCard>
  );
}
