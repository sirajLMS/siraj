"use client";

import { ChevronRight } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";

export function HistoryMobileHeader({ studentName, monthStr }: Readonly<{ studentName: string; monthStr: string }>) {
  const t = useStudentHistoryLabels();
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: theme.palette.onSurfaceVariant,
          mb: 1,
        })}
      >
        <Typography variant="labelMd">{t.breadcrumbs.archive}</Typography>
        <ChevronRight
          sx={theme => ({
            fontSize: theme.typography.bodyLg.fontSize,
            transform: theme.direction === "rtl" ? ("scaleX(-1)" as const) : undefined,
          })}
        />
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontWeight: 700,
            color: theme.palette.primary.main,
          })}
        >
          {t.breadcrumbs.history}
        </Typography>
      </Box>
      <Typography
        variant="titleLg"
        sx={theme => ({
          lineHeight: 1.2,
          color: theme.palette.primary.main,
        })}
      >
        {t.pageTitle(studentName)}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ mt: 0.5, color: theme.palette.onSurfaceVariant })}>
        {t.pageSubtitle(monthStr)}
      </Typography>
    </Box>
  );
}
