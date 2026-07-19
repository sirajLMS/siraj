"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";

export interface MobileContentInsetProps {
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
}

/**
 * Applies the shared mobile content gutter (`paddingInline: 2`).
 * Use for toolbars, button rows, search fields, and ad-hoc blocks that sit
 * inside an edge-to-edge page shell. Do not wrap `MobileHorizontalScrollRow`
 * or other full-bleed sections that own their own inset.
 */
export function MobileContentInset({ children, sx }: MobileContentInsetProps) {
  return <Box sx={mergeSx(mobileContentGutterSx, sx)}>{children}</Box>;
}
