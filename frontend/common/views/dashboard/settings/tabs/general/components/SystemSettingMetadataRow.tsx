"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type SystemSettingMetadataRowProps = {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
};

export function SystemSettingMetadataRow({ icon, label, value }: Readonly<SystemSettingMetadataRowProps>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.25,
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.text.secondary,
          flexShrink: 0,
          "& .MuiSvgIcon-root": { fontSize: 18 },
        })}
      >
        {icon}
      </Box>
      <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary, flex: 1 }}>
        {label}
      </Typography>
      <Typography sx={{ typography: "bodySm", fontWeight: 600, textAlign: "end" }}>{value}</Typography>
    </Box>
  );
}
