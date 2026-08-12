import { Stack, Typography } from "@mui/material";
import type * as React from "react";

export function InfoField({ label, value }: { readonly label: string; readonly value: React.ReactNode }) {
  return (
    <Stack spacing={0.25}>
      <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>{label}</Typography>
      {value}
    </Stack>
  );
}
