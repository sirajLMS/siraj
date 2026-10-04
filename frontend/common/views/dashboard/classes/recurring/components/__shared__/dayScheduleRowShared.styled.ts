import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledDayScheduleRowContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: 3,
  border: isActiveOverride ? 2 : 1,
  borderColor: isActiveOverride ? theme.palette.primary.main : theme.palette.outlineVariant,
  backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHigh : theme.palette.surface,
  transition: theme.transitions.create("background-color", { duration: 200 }),
  "&:hover": {
    backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHighest : theme.palette.surfaceContainerLow,
  },
}));

export const StyledOverrideToggleIconButton = styled(IconButton, {
  shouldForwardProp: prop => prop !== "isActiveOverride",
})<{ isActiveOverride: boolean }>(({ theme, isActiveOverride }) => ({
  color: isActiveOverride ? theme.palette.primary.main : theme.palette.onSurfaceVariant,
  backgroundColor: isActiveOverride ? theme.palette.surfaceContainerHighest : undefined,
  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.surfaceContainerHighest,
  },
}));

export const StyledDayCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.outline,
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
}));

export const StyledDayLabelTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
}));
