"use client";

import type { SxProps, Theme } from "@mui/material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

const mobileLabelSx: SxProps<Theme> = theme => ({
  ...theme.typography.labelSm,
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
  display: "block",
  mb: 0.5,
});

export interface MobileFieldWrapperProps {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactNode;
}

/**
 * Mobile wrapper for form fields. Uses full-width layout and smaller labels per mobile mandate.
 */
export function MobileFieldWrapper({ label, required, error, children }: MobileFieldWrapperProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "100%", maxWidth: "100%" }}>
      <Box component="label" sx={mobileLabelSx}>
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
