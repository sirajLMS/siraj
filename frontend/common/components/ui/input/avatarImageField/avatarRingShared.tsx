import { alpha, Box } from "@mui/material";
import type * as React from "react";

type ResponsiveVal = number | { xs: number; md: number };

/**
 * Shared frosted container Box used by both AvatarImageField (edit) and ProfileAvatarView (read-only).
 */
export function AvatarFrostedContainer({
  children,
  px,
  py,
}: {
  readonly children: React.ReactNode;
  readonly px: ResponsiveVal;
  readonly py: ResponsiveVal;
}): React.ReactNode {
  return (
    <Box
      sx={theme => ({
        width: "100%",
        borderRadius: theme.layout.radius.section,
        border: `1px solid ${alpha(theme.palette.outlineVariant, 0.6)}`,
        backgroundColor: alpha(theme.palette.surfaceContainer, 0.72),
        backdropFilter: "blur(16px)",
        px,
        py,
      })}
    >
      {children}
    </Box>
  );
}

/**
 * Shared conic-gradient avatar ring used by both AvatarImageField and ProfileAvatarView.
 */
export function AvatarConicRing({
  size,
  children,
}: {
  readonly size: ResponsiveVal;
  readonly children: React.ReactNode;
}): React.ReactNode {
  return (
    <Box
      sx={theme => ({
        width: size,
        height: size,
        borderRadius: "50%",
        p: "3px",
        background: `conic-gradient(from 210deg, ${theme.palette.primary.main} 0 62%, transparent 62% 100%)`,
      })}
    >
      <Box
        sx={theme => ({
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: theme.palette.surfaceContainerHighest,
          border: `2px solid ${theme.palette.surface}`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        {children}
      </Box>
    </Box>
  );
}
