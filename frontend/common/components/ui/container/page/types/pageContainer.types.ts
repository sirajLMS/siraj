import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";

// NEW FOR PLAN v5: unified PageContainerProps lifted from Mobile/Desktop twins (byte-identical).
export interface PageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}
