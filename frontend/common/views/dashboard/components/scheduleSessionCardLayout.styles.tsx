"use client";

import { Box, type Theme, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ScheduleSessionPersonAccentTone } from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.types";

export function getPersonAccentColor(tone: ScheduleSessionPersonAccentTone, theme: Theme): string {
  switch (tone) {
    case "teacher":
      return theme.palette.onSurfaceVariant;
    case "student":
      return theme.palette.primary.main;
    case "default":
      return theme.palette.onSurface;
  }
  throw new Error(`Unhandled case in getPersonAccentColor`);
}

export const scheduleSessionCardContentSx = {
  paddingBlock: 2,
  paddingInline: 2,
  width: "100%",
  minHeight: 220,
  boxSizing: "border-box",
  overflow: "hidden",
} as const;

export const StyledScheduleSessionCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
}));

export const StyledScheduleSessionCardHeaderMain = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.75),
  minWidth: 0,
  flex: 1,
}));

export const StyledScheduleSessionCardActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  flexShrink: 0,
  padding: theme.spacing(0.25),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerHigh,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

export const StyledScheduleSessionTimeHighlight = styled(Box, {
  shouldForwardProp: prop => prop !== "isAbsent",
})<{ isAbsent?: boolean }>(({ theme, isAbsent }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.layout.radius.card,
  // Status-aware background: absent classes use errorContainer (red) so the
  // time bar doesn't show a misleading green/teal "active" color for a class
  // that was marked absent. Fixes the VLM-flagged conflicting visual signal.
  backgroundColor: isAbsent ? theme.palette.errorContainer : theme.palette.primaryContainer,
  border: `1px solid ${isAbsent ? theme.palette.error.light : theme.palette.outlineVariant}`,
  minWidth: 0,
  overflow: "hidden",
}));

export const StyledScheduleSessionTimeHighlightContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  flex: 1,
  overflow: "hidden",
});

export const StyledScheduleSessionTimeHighlightLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "isAbsent",
})<{ isAbsent?: boolean }>(({ theme, isAbsent }) => ({
  color: isAbsent ? theme.palette.onErrorContainer : theme.palette.onPrimaryContainer,
  flexShrink: 0,
  whiteSpace: "nowrap",
  opacity: 0.8,
}));

export const StyledScheduleSessionTimeHighlightText = styled(Typography, {
  shouldForwardProp: prop => prop !== "isAbsent",
})<{ isAbsent?: boolean }>(({ theme, isAbsent }) => ({
  color: isAbsent ? theme.palette.onErrorContainer : theme.palette.onPrimaryContainer,
  fontWeight: 700,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const StyledScheduleSessionMetaPanel = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "stretch",
  marginBottom: theme.spacing(1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.surfaceContainerHigh,
  border: `1px solid ${theme.palette.outlineVariant}`,
  overflow: "hidden",
}));

export const StyledScheduleSessionMetaTile = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  padding: theme.spacing(1.25, 1),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(0.375),
  "&:not(:last-child)": {
    borderInlineEnd: `1px solid ${theme.palette.outlineVariant}`,
  },
}));

export const StyledScheduleSessionMetaLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
}));

export const StyledScheduleSessionMetaValue = styled(Typography, {
  shouldForwardProp: prop => prop !== "tone",
})<{ tone?: ScheduleSessionPersonAccentTone }>(({ theme, tone = "default" }) => ({
  color: getPersonAccentColor(tone, theme),
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
}));

export const StyledScheduleSessionPeopleRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(1.25),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

export const StyledScheduleSessionPersonCell = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: theme.spacing(0.75),
  minWidth: 0,
  overflow: "hidden",
  "&:first-of-type": {
    paddingInlineEnd: theme.spacing(0.75),
    borderInlineEnd: `1px solid ${theme.palette.outlineVariant}`,
  },
}));
