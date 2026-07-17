"use client";

import { Box, LinearProgress, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { useLanguageSwitch } from "@/frontend/common/hooks/useLanguageSwitch";
import { useThemeMode } from "@/frontend/common/hooks/useThemeMode";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export interface DesktopPageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

/**
 * Desktop page content wrapper. DashboardLayout already applies pageMargin —
 * desktop views must NOT add their own outer padding. Renders a fixed-position
 * LinearProgress loading bar (top: 64px) while theme or language is changing.
 */
export function DesktopPageContainer({ sx, children }: DesktopPageContainerProps) {
  const { isThemeChanging } = useThemeMode();
  const { isPending: isLanguageChanging } = useLanguageSwitch();

  const showProgressBar = isThemeChanging || isLanguageChanging;

  return (
    <Box
      sx={mergeSx(
        {
          display: "flex",
          flexDirection: "column",
          gap: theme => theme.layout.sectionGap,
          width: "100%",
          position: "relative",
        },
        sx
      )}
    >
      {showProgressBar ? (
        <Box
          sx={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            zIndex: theme => theme.zIndex.appBar + 1,
            height: "4px",
          }}
        >
          <LinearProgress
            sx={{
              width: "100%",
              height: "100%",
              "& .MuiLinearProgress-bar": {
                backgroundColor: theme => theme.palette.primary.main,
              },
            }}
          />
        </Box>
      ) : null}
      {children}
    </Box>
  );
}
