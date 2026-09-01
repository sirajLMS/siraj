"use client";

import { Stack, Typography } from "@mui/material";

interface SettingsCardBodyField {
  readonly label: string;
  readonly value: string;
}

export type SettingsCardBodySharedProps = {
  readonly title: string;
  readonly secondary: string;
  readonly fields: readonly SettingsCardBodyField[];
};

export function SettingsCardBodyShared({ title, secondary, fields }: Readonly<SettingsCardBodySharedProps>) {
  return (
    <Stack spacing={0.5} sx={{ width: "100%" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>{title}</Typography>
        <Typography sx={theme => ({ typography: "labelMd", color: theme.palette.text.secondary })}>
          {secondary}
        </Typography>
      </Stack>
      {fields.map(field => (
        <Typography key={field.label} sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {field.label}: {field.value}
        </Typography>
      ))}
    </Stack>
  );
}
