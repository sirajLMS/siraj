"use client";

import type { SxProps, Theme } from "@mui/material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

const labelSx: SxProps<Theme> = theme => ({
  ...theme.typography.labelMd,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  display: "block",
  mb: 0.5,
});

export interface DesktopFieldWrapperProps {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactNode;
}

/**
 * Desktop wrapper for form fields that handles labels, required indicators, and error messages.
 */
export function DesktopFieldWrapper({ label, required, error, children }: DesktopFieldWrapperProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "100%" }}>
      <Box component="label" sx={labelSx}>
        {label}
        {required && (
          <Box component="span" sx={theme => ({ color: theme.palette.error.main, ml: 0.5 })}>
            *
          </Box>
        )}
      </Box>
      {children}
      {error && (
        <Typography variant="caption" sx={theme => ({ color: theme.palette.error.main })}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
