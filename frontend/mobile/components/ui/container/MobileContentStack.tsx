"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface MobileContentStackProps {
  readonly children: ReactNode;
  readonly gap?: number;
  readonly paddingBottom?: number;
  readonly sx?: SxProps<Theme>;
}

export function MobileContentStack({ children, gap = 3, paddingBottom = 4, sx }: MobileContentStackProps) {
  return <Box sx={mergeSx({ display: "flex", flexDirection: "column", gap, pb: paddingBottom }, sx)}>{children}</Box>;
}
