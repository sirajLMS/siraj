"use client";

import { Avatar, Box, type Theme, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type * as React from "react";
import { Link } from "@/shared/i18n";

export type ScheduleSessionPersonAccentTone = "teacher" | "student" | "default";

export function getScheduleSessionNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getPersonAccentColor(tone: ScheduleSessionPersonAccentTone, theme: Theme): string {
  switch (tone) {
    case "teacher":
      return theme.palette.onSurfaceVariant;
    case "student":
      return theme.palette.primary.main;
    case "default":
      return theme.palette.onSurface;
  }
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

export const StyledScheduleSessionTimeHighlight = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.primaryContainer,
  border: `1px solid ${theme.palette.outlineVariant}`,
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

export const StyledScheduleSessionTimeHighlightLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimaryContainer,
  flexShrink: 0,
  whiteSpace: "nowrap",
  opacity: 0.8,
}));

export const StyledScheduleSessionTimeHighlightText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimaryContainer,
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

const StyledMetaTile = styled(Box)(({ theme }) => ({
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

const StyledMetaLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
}));

const StyledMetaValue = styled(Typography, {
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

const StyledPersonCell = styled(Box)(({ theme }) => ({
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

const StyledPersonContentRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  minWidth: 0,
  width: "100%",
}));

const StyledPersonAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  flexShrink: 0,
  fontSize: theme.typography.labelSm.fontSize,
  fontWeight: theme.typography.labelSm.fontWeight,
  backgroundColor: theme.palette.surfaceContainerHighest,
  color: theme.palette.onSurfaceVariant,
}));

const StyledPersonText = styled(Box)({
  minWidth: 0,
  flex: 1,
  overflow: "hidden",
});

const StyledPersonLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

const StyledPersonName = styled(Typography, {
  shouldForwardProp: prop => prop !== "tone",
})<{ tone: ScheduleSessionPersonAccentTone }>(({ theme, tone }) => ({
  color: getPersonAccentColor(tone, theme),
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
}));

export interface ScheduleSessionMetaStatItem {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly tone?: ScheduleSessionPersonAccentTone;
}

export function ScheduleSessionCardMetaBar({ items }: { readonly items: readonly ScheduleSessionMetaStatItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <StyledScheduleSessionMetaPanel>
      {items.map(item => (
        <StyledMetaTile key={item.label}>
          <StyledMetaLabel variant="labelMd" title={item.label}>
            {item.label}
          </StyledMetaLabel>
          <StyledMetaValue variant="bodyMd" tone={item.tone}>
            {item.value}
          </StyledMetaValue>
        </StyledMetaTile>
      ))}
    </StyledScheduleSessionMetaPanel>
  );
}

export interface ScheduleSessionCardPersonCellProps {
  readonly name: string;
  readonly label: string;
  readonly tone: ScheduleSessionPersonAccentTone;
  readonly href?: string;
  readonly avatarUrl?: string | null;
}

export function ScheduleSessionCardPersonCell({
  name,
  label,
  tone,
  href,
  avatarUrl,
}: ScheduleSessionCardPersonCellProps) {
  return (
    <StyledPersonCell>
      <StyledPersonLabel variant="labelMd" title={label}>
        {label}
      </StyledPersonLabel>
      <StyledPersonContentRow>
        <StyledPersonAvatar src={avatarUrl ?? undefined} alt={name} aria-hidden={!avatarUrl}>
          {getScheduleSessionNameInitials(name)}
        </StyledPersonAvatar>
        <StyledPersonText>
          <StyledPersonName
            variant="bodyMd"
            title={name}
            tone={tone}
            {...(href ? { component: Link, href } : {})}
            sx={
              href
                ? {
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }
                : undefined
            }
          >
            {name}
          </StyledPersonName>
        </StyledPersonText>
      </StyledPersonContentRow>
    </StyledPersonCell>
  );
}
