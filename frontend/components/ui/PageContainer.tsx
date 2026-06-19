"use client";

import { Box, LinearProgress, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { useLanguageSwitch } from "@/frontend/hooks/useLanguageSwitch";
import { useThemeMode } from "@/frontend/hooks/useThemeMode";
import { mergeSx } from "./mergeSx";

interface PageContainerProps {
  readonly sx?: SxProps<Theme>;
  readonly children: ReactNode;
}

/**
 * Standard page content wrapper. DashboardLayout already applies pageMargin —
 * views must NOT add their own outer padding.
 */
export function PageContainer({ sx, children }: PageContainerProps) {
  const { isThemeChanging } = useThemeMode();
  const { isPending: isLanguageChanging } = useLanguageSwitch();

  // Show progress bar when either theme or language is changing
  const showProgressBar = isThemeChanging || isLanguageChanging;

  return (
    <Box
      sx={mergeSx(
        {
          display: "flex",
          flexDirection: "column",
          gap: theme => theme.layout.sectionGap,
          width: "100%",
          position: "relative", // Needed for absolute positioning of progress bar
        },
        sx
      )}
    >
      {/* Floating progress bar at the top when theme or language is changing - positioned relative to viewport */}
      {showProgressBar && (
        <Box
          sx={{
            position: "fixed",
            top: "64px", // Height of the navbar
            left: 0,
            right: 0,
            zIndex: theme => theme.zIndex.appBar + 1, // Above most elements but below app bars
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
      )}
      {children}
    </Box>
  );
}
