"use client";

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export interface PermissionKeyChipSharedProps {
  readonly label: string;
  readonly sx?: SxProps<Theme>;
}

/**
 * Monospace permission-key pill (surfaceVariant/onSurfaceVariant) shared by
 * the permissions catalog and group detail views across both tiers.
 */
export function PermissionKeyChipShared({ label, sx }: Readonly<PermissionKeyChipSharedProps>) {
  return (
    <Box
      sx={[
        theme => ({
          fontFamily: "monospace",
          typography: "labelMd",
          backgroundColor: theme.palette.surfaceVariant,
          color: theme.palette.onSurfaceVariant,
          padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
          borderRadius: theme.shape.borderRadius,
          display: "inline-block",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Box>
  );
}
