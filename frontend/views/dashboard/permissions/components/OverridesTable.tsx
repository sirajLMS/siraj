"use client";

import { Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { OverridesTableRow } from "./OverridesTableRow";

const StyledTableWrapper = styled(Box)({
  flex: 1,
  overflow: "auto",
  minHeight: 0,
});

const StyledLoadingContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  paddingTop: 64,
  paddingBottom: 64,
});

const StyledHeaderCell = styled(TableCell)({
  fontWeight: 600,
});

const StyledOverrideControlCell = styled(TableCell)({
  fontWeight: 600,
  width: "320px",
});

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
    <StyledTableWrapper>
      {/* Loading State */}
      {isDialogLoading && !filteredPermissions.length ? (
        <StyledLoadingContainer>
          <CircularProgress color="primary" />
        </StyledLoadingContainer>
      ) : (
        /* Overrides Table */
        <TableContainer>
          <Table stickyHeader aria-label="permissions overrides table">
            {/* Table Header */}
            <TableHead>
              <TableRow>
                <StyledHeaderCell>Permission</StyledHeaderCell>
                <StyledHeaderCell>Group Baseline</StyledHeaderCell>
                <StyledOverrideControlCell>Override Control</StyledOverrideControlCell>
              </TableRow>
            </TableHead>
            {/* Table Body - Permission Rows */}
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
    </StyledTableWrapper>
  );
}
