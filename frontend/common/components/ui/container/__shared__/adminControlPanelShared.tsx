"use client";

import { AdminPanelSettingsOutlined, type SvgIconComponent } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  panelCardHeaderSx,
  panelCardPaperSx,
} from "@/frontend/common/components/ui/container/__shared__/panelCardSxShared";

export interface AdminControlPanelSharedOptions {
  readonly headerPx: number;
  readonly headerPy: number;
  readonly headerGap: number;
  readonly bodyPadding: number;
  readonly iconSx: (theme: import("@mui/material/styles").Theme) => Record<string, unknown>;
  readonly titleSx: (theme: import("@mui/material/styles").Theme) => Record<string, unknown>;
}

interface AdminControlPanelSharedProps {
  readonly title: string;
  readonly icon?: SvgIconComponent;
  readonly children: ReactNode;
  readonly options: AdminControlPanelSharedOptions;
}

export function AdminControlPanelShared({
  title,
  icon: Icon = AdminPanelSettingsOutlined,
  children,
  options,
}: Readonly<AdminControlPanelSharedProps>) {
  const { headerPx, headerPy, headerGap, bodyPadding, iconSx, titleSx } = options;

  return (
    <Paper elevation={0} sx={theme => panelCardPaperSx(theme)}>
      <Box sx={theme => panelCardHeaderSx(theme, headerPx, headerPy, headerGap)}>
        <Icon sx={iconSx} />
        <Typography sx={titleSx}>{title}</Typography>
      </Box>
      <Box sx={{ p: bodyPadding }}>{children}</Box>
    </Paper>
  );
}
