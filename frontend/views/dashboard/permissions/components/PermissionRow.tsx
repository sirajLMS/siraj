"use client";

import { Lock } from "@mui/icons-material";
import { Box, Checkbox, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission } from "@/frontend/graphql/generated/gql/graphql-types";

const StyledPermissionRowContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "isSystem" && prop !== "isChecked",
})<{ isSystem: boolean; isChecked: boolean }>(({ theme, isSystem, isChecked }) => ({
  display: "flex",
  alignItems: "center",
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  cursor: isSystem ? "not-allowed" : "pointer",
  backgroundColor: isChecked ? theme.palette.primaryContainer : "transparent",
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  "&:last-child": { borderBottom: "none" },
  "&:hover": {
    backgroundColor: isChecked ? theme.palette.primaryContainer : theme.palette.action.hover,
  },
  opacity: isSystem ? 0.7 : 1,
  transition: "background-color 0.2s",
}));

const StyledPermissionContent = styled(Box)(({ theme }) => ({
  flex: 1,
  marginLeft: theme.spacing(1),
}));

const StyledKeyRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledPermissionKeyText = styled(Typography, {
  shouldForwardProp: prop => prop !== "isChecked",
})<{ isChecked: boolean }>(({ theme, isChecked }) => ({
  fontFamily: "monospace",
  fontWeight: 600,
  color: isChecked ? theme.palette.onPrimaryContainer : theme.palette.primary.main,
}));

const StyledPermissionDescription = styled(Typography, {
  shouldForwardProp: prop => prop !== "isChecked",
})<{ isChecked: boolean }>(({ theme, isChecked }) => ({
  color: isChecked ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

type ValidPermission = Permission & { id: string; key: string; category: string };

interface PermissionRowProps {
  readonly perm: ValidPermission;
  readonly isChecked: boolean;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
  readonly t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function PermissionRow({ perm, isChecked, onTogglePermission, isLoading, t }: Readonly<PermissionRowProps>) {
  return (
    /* Permission Row */
    <StyledPermissionRowContainer
      isSystem={!!perm.isSystem}
      isChecked={isChecked}
      onClick={() => onTogglePermission(perm.id, !!perm.isSystem)}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isChecked}
        disabled={!!perm.isSystem || isLoading}
        onClick={e => e.stopPropagation()}
        onChange={() => onTogglePermission(perm.id, !!perm.isSystem)}
      />

      {/* Permission Content */}
      <StyledPermissionContent>
        {/* Key & Lock Icon */}
        <StyledKeyRow>
          <StyledPermissionKeyText variant="bodyMd" isChecked={isChecked}>
            {perm.key}
          </StyledPermissionKeyText>
          {perm.isSystem && (
            <Tooltip title={t("corePermissionTooltip")}>
              <Lock fontSize="small" color="error" />
            </Tooltip>
          )}
        </StyledKeyRow>
        {/* Description */}
        {perm.description && (
          <StyledPermissionDescription variant="caption" isChecked={isChecked}>
            {perm.description}
          </StyledPermissionDescription>
        )}
      </StyledPermissionContent>
    </StyledPermissionRowContainer>
  );
}
