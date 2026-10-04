"use client";

import { Box, Stack, Typography } from "@mui/material";

export function DetailField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Stack sx={{ flexDirection: "column", gap: 0.25 }}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
        {value}
      </Typography>
    </Stack>
  );
}

export function ProfileField({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Stack sx={{ gap: 0.25 }}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

interface NoteBlockProps {
  readonly label: string;
  readonly value: string;
  readonly isError?: boolean;
}

export function NoteBlock({ label, value, isError }: NoteBlockProps) {
  return (
    <Box>
      <Typography
        variant="labelUppercase"
        sx={theme => ({
          color: isError ? theme.palette.error.main : theme.palette.onSurfaceVariant,
          mb: 0.5,
        })}
      >
        {label}
      </Typography>
      <Typography
        variant="bodyMd"
        sx={theme => ({ color: isError ? theme.palette.error.main : theme.palette.onSurface })}
      >
        {value}
      </Typography>
    </Box>
  );
}
