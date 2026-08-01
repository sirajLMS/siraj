"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface ParentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function ParentQuotaView({ t }: Readonly<ParentQuotaViewProps>) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="titleLg" sx={{ mb: 2 }}>
        {t.audience.parentTitle}
      </Typography>
      <Paper sx={{ p: 4, textAlign: "center" }} elevation={0} variant="outlined">
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {t.audience.noChildren}
        </Typography>
      </Paper>
    </Box>
  );
}
