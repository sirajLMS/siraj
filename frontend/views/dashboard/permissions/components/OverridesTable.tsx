"use client";

import { Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { OverridesTableRow } from "./OverridesTableRow";

export type OverrideState = "GRANTED" | "DENIED" | "INHERIT";

interface OverridesTableProps {
  readonly filteredPermissions: readonly Permission[];
  readonly userGroups: readonly PermissionGroup[];
  readonly localOverrides: Record<string, OverrideState>;
  readonly mode: "effective" | "edit";
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}

export function OverridesTable({
  filteredPermissions,
  userGroups,
  localOverrides,
  mode,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverridesTableProps>) {
  return (
    <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {isDialogLoading && !filteredPermissions.length ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <TableContainer>
          <Table stickyHeader aria-label="permissions overrides table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Permission</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Group Baseline</TableCell>
                <TableCell sx={{ fontWeight: 600, width: "320px" }}>Override Control</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPermissions.map(p => {
                if (!p.id) return null;

                const baselineGroups = userGroups.filter(
                  g => (p.id && g.permissionIds?.includes(p.id)) || (p.key && g.permissionIds?.includes(p.key))
                );
                const isAllowedByGroup = baselineGroups.length > 0;
                const baselineText = isAllowedByGroup
                  ? `Allowed via ${baselineGroups.map(g => g.name).join(", ")}`
                  : "Not Set";

                const overrideState: OverrideState = localOverrides[p.id] || "INHERIT";

                const effectiveState: "allowed" | "denied" | "not_set" =
                  overrideState === "GRANTED"
                    ? "allowed"
                    : overrideState === "DENIED"
                      ? "denied"
                      : isAllowedByGroup
                        ? "allowed"
                        : "not_set";

                return (
                  <OverridesTableRow
                    key={p.id}
                    permission={p}
                    baselineGroups={baselineGroups}
                    isAllowedByGroup={isAllowedByGroup}
                    baselineText={baselineText}
                    overrideState={overrideState}
                    effectiveState={effectiveState}
                    mode={mode}
                    isDialogLoading={isDialogLoading}
                    handleOverrideChange={handleOverrideChange}
                  />
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
