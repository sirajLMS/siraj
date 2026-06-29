"use client";

import { AssignmentIndOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui";
import type { CurrentTeacherCardProps } from "../types";

export function CurrentTeacherCard({ currentTeacherName, teacherId }: Readonly<CurrentTeacherCardProps>) {
  const t = useTranslations("dashboard.teacherReassignment.currentTeacher");

  return (
    <BaseCard
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
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="labelUppercase"
          sx={theme => ({
            mb: 1,
            opacity: 0.9,
            color: theme.palette.onPrimary,
          })}
        >
          {t("title")}
        </Typography>
        <Typography
          variant="headlineMd"
          sx={theme => ({
            fontWeight: 700,
            mb: 2,
            color: theme.palette.onPrimary,
          })}
        >
          {currentTeacherName || t("unset")}
        </Typography>
        <Typography
          variant="labelSm"
          sx={theme => ({
            opacity: 0.8,
            lineHeight: 1.5,
            color: theme.palette.onPrimary,
          })}
        >
          {t("notice")}
        </Typography>
      </Box>
      <AssignmentIndOutlined
        sx={theme => ({
          position: "absolute",
          right: -16,
          bottom: -16,
          fontSize: 120,
          opacity: 0.1,
          color: theme.palette.onPrimary,
        })}
      />
    </BaseCard>
  );
}
