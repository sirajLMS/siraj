"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface MobileSectionTitleRowProps {
  readonly title: ReactNode;
  readonly actions?: ReactNode;
  readonly sx?: SxProps<Theme>;
}

/**
 * "Title + SEE ALL" (or other actions) row with the shared mobile content gutter.
 * Use for section headers that are not inside `MobileSectionPanel`'s title bar.
 */
export function MobileSectionTitleRow({ title, actions, sx }: MobileSectionTitleRowProps) {
  return (
    <Box
      sx={mergeSx(
        mobileContentGutterSx,
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
        },
        sx
      )}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>{title}</Box>
      {actions ? <Box sx={{ flex: "0 0 auto" }}>{actions}</Box> : null}
    </Box>
  );
}
