import { Stack, Typography } from "@mui/material";
import type * as React from "react";

export function InfoField({ label, value }: { readonly label: string; readonly value: React.ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>{label}</Typography>
      {typeof value === "string" ? <Typography sx={{ typography: "bodyMd" }}>{value}</Typography> : value}
    </Stack>
  );
}
