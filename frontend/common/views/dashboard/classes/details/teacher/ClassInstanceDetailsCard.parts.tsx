"use client";

import { Box, Stack } from "@mui/material";
import {
  StyledCardHeading,
  StyledDetailFieldLabel,
  StyledHeadingInfoIcon,
} from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.styles";
import type {
  ClassInstanceDetailsHeaderProps,
  DetailFieldProps,
} from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.types";

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <StyledDetailFieldLabel variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </StyledDetailFieldLabel>
      <Box sx={theme => ({ color: theme.palette.onSurface })}>{value}</Box>
    </Box>
  );
}

export function ClassInstanceDetailsHeader({ title }: ClassInstanceDetailsHeaderProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
      <StyledCardHeading variant="headlineMd" sx={theme => ({ color: theme.palette.onSurface, gap: theme.spacing(1) })}>
        <StyledHeadingInfoIcon sx={theme => ({ color: theme.palette.onSurfaceVariant })} />
        {title}
      </StyledCardHeading>
    </Stack>
  );
}
