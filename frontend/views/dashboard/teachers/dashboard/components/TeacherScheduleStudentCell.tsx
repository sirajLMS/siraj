"use client";

import { Avatar, Box, Typography } from "@mui/material";
import type { TeacherScheduleRow } from "@/frontend/stores/mockTeacherDashboardTypes";

export function TeacherScheduleStudentCell({ row }: Readonly<{ row: TeacherScheduleRow }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32, typography: "labelMd" }}>{row.studentInitials}</Avatar>
      <Typography sx={{ typography: "bodyMd" }}>{row.studentName}</Typography>
    </Box>
  );
}
