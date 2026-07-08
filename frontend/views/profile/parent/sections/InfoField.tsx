"use client";

import { Stack, Typography } from "@mui/material";

export function InfoField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>{label}</Typography>
      <Typography sx={{ typography: "bodyMd" }}>{value}</Typography>
    </Stack>
  );
}
