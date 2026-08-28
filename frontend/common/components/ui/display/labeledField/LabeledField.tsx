"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type * as React from "react";

export interface LabeledFieldProps {
  readonly label: string;
  readonly value: React.ReactNode;
}

/**
 * Standard label + value field used across detail panels and profile sections.
 * Label in `labelMd` / `onSurfaceVariant`. String values render in `bodyMd` /
 * `onSurface` 500; non-string values (badges, icon actions, display primitives)
 * render as-is beneath the label.
 */
export function LabeledField({ label, value }: Readonly<LabeledFieldProps>): React.ReactNode {
  return (
    <Stack sx={{ gap: 0.25 }}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      {typeof value === "string" ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}
