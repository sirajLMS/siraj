"use client";

import { Box, TableCell, TableRow, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { OverrideEditControls } from "@/frontend/views/dashboard/permissions/components/OverrideEditControls";
import { OverrideEffectiveDisplay } from "@/frontend/views/dashboard/permissions/components/OverrideEffectiveDisplay";
import type { OverrideState } from "@/frontend/views/dashboard/permissions/components/OverridesTable";

const StyledPermissionKeyContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

const StyledPermissionKeyText = styled(Typography)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: theme.typography.labelMd.fontSize,
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const StyledPermissionDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const StyledBaselineText = styled(Typography, {
  shouldForwardProp: prop => prop !== "isAllowed",
})<{ isAllowed: boolean }>(({ theme, isAllowed }) => ({
  color: isAllowed ? theme.palette.success.main : theme.palette.text.secondary,
}));

interface OverridesTableRowProps {
  readonly permission: Permission;
  readonly baselineGroups: readonly PermissionGroup[];
  readonly isAllowedByGroup: boolean;
  readonly baselineText: string;
  readonly overrideState: OverrideState;
  readonly effectiveState: "allowed" | "denied" | "not_set";
  readonly mode: "effective" | "edit";
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}

export function OverridesTableRow({
  permission,
  isAllowedByGroup,
  baselineText,
  overrideState,
  effectiveState,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesTableRowProps>) {
  return (
    <TableRow key={permission.id} hover>
      {/* Permission Key & Description */}
      <TableCell>
        <StyledPermissionKeyContainer>
          <StyledPermissionKeyText variant="bodyMd">{permission.key}</StyledPermissionKeyText>
          <StyledPermissionDescription variant="caption">{permission.description}</StyledPermissionDescription>
        </StyledPermissionKeyContainer>
      </TableCell>

      {/* Group Baseline */}
      <TableCell>
        <StyledBaselineText variant="bodyMd" isAllowed={isAllowedByGroup}>
          {baselineText}
        </StyledBaselineText>
      </TableCell>

      {/* Override Control */}
      <TableCell>
        {mode === "effective" ? (
          <OverrideEffectiveDisplay effectiveState={effectiveState} overrideState={overrideState} />
        ) : (
          <OverrideEditControls
            permissionId={permission.id ?? ""}
            overrideState={overrideState}
            isDialogLoading={isDialogLoading}
            handleOverrideChange={handleOverrideChange}
          />
        )}
      </TableCell>
    </TableRow>
  );
}
