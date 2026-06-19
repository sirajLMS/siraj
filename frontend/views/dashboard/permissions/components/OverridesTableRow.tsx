"use client";

import { Box, TableCell, TableRow, Typography } from "@mui/material";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { OverrideEditControls } from "./OverrideEditControls";
import { OverrideEffectiveDisplay } from "./OverrideEffectiveDisplay";
import type { OverrideState } from "./OverridesTable";

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
      <TableCell>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            variant="bodyMd"
            sx={theme => ({
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: theme.palette.primary.main,
            })}
          >
            {permission.key}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}>
            {permission.description}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: isAllowedByGroup ? theme.palette.success.main : theme.palette.text.secondary,
            fontSize: "0.875rem",
          })}
        >
          {baselineText}
        </Typography>
      </TableCell>

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
