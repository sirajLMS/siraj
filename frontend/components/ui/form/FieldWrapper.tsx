"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { labelSx } from "./formFieldStyles";

interface FieldWrapperProps {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: ReactNode;
}

/**
 * Shared wrapper for form fields that handles labels, required indicators, and error messages.
 */
export function FieldWrapper({ label, required, error, children }: FieldWrapperProps) {
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
