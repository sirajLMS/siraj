"use client";

import { BlockOutlined, CheckCircleOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";

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
                  <TableRow key={p.id} hover>
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
                          {p.key}
                        </Typography>
                        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}>
                          {p.description}
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {effectiveState === "allowed" && (
                            <Box
                              sx={theme => ({
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: theme.palette.success.main,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                              })}
                            >
                              <CheckCircleOutlined fontSize="small" />
                              Allowed
                            </Box>
                          )}
                          {effectiveState === "denied" && (
                            <Box
                              sx={theme => ({
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: theme.palette.error.main,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                              })}
                            >
                              <BlockOutlined fontSize="small" />
                              Denied
                            </Box>
                          )}
                          {effectiveState === "not_set" && (
                            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                              Not Set
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            sx={theme => ({
                              color: theme.palette.text.disabled,
                              fontSize: "0.75rem",
                              ml: 1,
                            })}
                          >
                            {overrideState === "GRANTED" && "(Explicit Grant)"}
                            {overrideState === "DENIED" && "(Explicit Deny)"}
                            {overrideState === "INHERIT" && "(Inherited)"}
                          </Typography>
                        </Box>
                      ) : (
                        <ButtonGroup variant="outlined" size="small" fullWidth disabled={isDialogLoading}>
                          <Button
                            onClick={() => p.id && handleOverrideChange(p.id, "INHERIT")}
                            sx={theme => ({
                              fontSize: "0.75rem",
                              bgcolor: overrideState === "INHERIT" ? theme.palette.primaryContainer : "transparent",
                              color:
                                overrideState === "INHERIT"
                                  ? theme.palette.onPrimaryContainer
                                  : theme.palette.text.secondary,
                              borderColor: theme.palette.divider,
                              "&:hover": {
                                bgcolor: overrideState === "INHERIT" ? theme.palette.primaryContainer : "transparent",
                                borderColor: theme.palette.divider,
                              },
                            })}
                          >
                            Inherit
                          </Button>
                          <Button
                            onClick={() => p.id && handleOverrideChange(p.id, "GRANTED")}
                            sx={theme => ({
                              fontSize: "0.75rem",
                              bgcolor: overrideState === "GRANTED" ? "rgba(46, 125, 50, 0.15)" : "transparent",
                              color:
                                overrideState === "GRANTED" ? theme.palette.success.main : theme.palette.text.secondary,
                              borderColor: theme.palette.divider,
                              fontWeight: overrideState === "GRANTED" ? 600 : 400,
                              "&:hover": {
                                bgcolor: overrideState === "GRANTED" ? "rgba(46, 125, 50, 0.15)" : "transparent",
                                borderColor: theme.palette.divider,
                              },
                            })}
                          >
                            Allow
                          </Button>
                          <Button
                            onClick={() => p.id && handleOverrideChange(p.id, "DENIED")}
                            sx={theme => ({
                              fontSize: "0.75rem",
                              bgcolor: overrideState === "DENIED" ? "rgba(211, 47, 47, 0.15)" : "transparent",
                              color:
                                overrideState === "DENIED" ? theme.palette.error.main : theme.palette.text.secondary,
                              borderColor: theme.palette.divider,
                              fontWeight: overrideState === "DENIED" ? 600 : 400,
                              "&:hover": {
                                bgcolor: overrideState === "DENIED" ? "rgba(211, 47, 47, 0.15)" : "transparent",
                                borderColor: theme.palette.divider,
                              },
                            })}
                          >
                            Deny
                          </Button>
                        </ButtonGroup>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
