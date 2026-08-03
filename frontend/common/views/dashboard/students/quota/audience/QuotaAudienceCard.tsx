"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface QuotaAudienceCardProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function QuotaAudienceCard({ title, children }: Readonly<QuotaAudienceCardProps>) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="titleLg" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>{children}</Box>
    </Box>
  );
}
