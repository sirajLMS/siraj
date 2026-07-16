"use client";

import { Box, LinearProgress, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainerCore } from "@/frontend/common/components/ui/container/page/pageContainerCore.base";
import { useLanguageSwitch } from "@/frontend/common/hooks/useLanguageSwitch";
import { useThemeMode } from "@/frontend/common/hooks/useThemeMode";

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

  // Show progress bar when either theme or language is changing
  const showProgressBar = isThemeChanging || isLanguageChanging;

  return (
    <PageContainerCore sx={sx}>
      {showProgressBar ? (
        <Box
          sx={{
            position: "fixed",
            top: "64px", // Height of the navbar
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
    </PageContainerCore>
  );
}
