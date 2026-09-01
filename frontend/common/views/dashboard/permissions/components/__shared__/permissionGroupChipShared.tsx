"use client";

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export interface PermissionGroupChipSharedProps {
  readonly label: string;
  readonly sx?: SxProps<Theme>;
}

/**
 * Permission-group name pill (secondaryContainer/onSecondaryContainer) shared
 * by the override grids, sidebar, and catalog "used in" cells across tiers.
 */
export function PermissionGroupChipShared({ label, sx }: Readonly<PermissionGroupChipSharedProps>) {
  return (
    <Box
      sx={[
        theme => ({
          typography: "labelMd",
          fontWeight: 500,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: theme.palette.secondaryContainer,
          color: theme.palette.onSecondaryContainer,
          border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
          display: "inline-block",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Box>
  );
}
