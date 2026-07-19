"use client";

import { Box, type SxProps, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";

export interface MobileEmptyStateProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: ReactNode;
  readonly sx?: SxProps<Theme>;
}

export function MobileEmptyState({ title, subtitle, icon, sx }: MobileEmptyStateProps) {
  return (
    <Box sx={mergeSx(mobileContentGutterSx, { py: 6, textAlign: "center" }, sx)}>
      {icon && <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>{icon}</Box>}
      <Typography variant="headlineMd" sx={{ mb: 1, color: theme => theme.palette.text.primary }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
