"use client";

import { useQuery } from "@apollo/client/react";
import { BlockOutlined, CheckCircleOutlined, CloseOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { Permission, PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";
import { userOverridesQueryDocument } from "@/frontend/graphql/sharedDocuments/permission-management.documents";

interface ManageOverridesDialogProps {
  readonly open: boolean;
  readonly userId: string | null;
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onSave: (userId: string, overrides: Array<{ permissionId: string; state: string }>) => Promise<void>;
}

type OverrideState = "GRANTED" | "DENIED" | "INHERIT";

export function ManageOverridesDialog({
  open,
  userId,
  users,
  groups,
  permissions,
  isLoading,
  onClose,
  onSave,
}: Readonly<ManageOverridesDialogProps>) {
  const t = useTranslations("dashboard.permissions");
  const [mode, setMode] = useState<"effective" | "edit">("edit");
  const [searchQuery, setSearchQuery] = useState("");
  const [localOverrides, setLocalOverrides] = useState<Record<string, OverrideState>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Find the selected user
  const user = useMemo(() => users.find(u => u.id === userId) || null, [users, userId]);

  // Fetch overrides for this user
  const { data: queryData, loading: queryLoading } = useQuery(userOverridesQueryDocument, {
    variables: { userId: userId ?? "" },
    skip: !userId || !open,
  });

  // Groups this user belongs to
  const userGroups = useMemo(() => {
    if (!userId) return [];
    return groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
  }, [groups, userId]);

  // Initialize local overrides when query returns
  useEffect(() => {
    if (queryData?.userOverrides) {
      const overridesMap: Record<string, OverrideState> = {};
      for (const override of queryData.userOverrides) {
        if (override.permissionId) {
          overridesMap[override.permissionId] = override.state as OverrideState;
        }
      }
      setLocalOverrides(overridesMap);
    } else {
      setLocalOverrides({});
    }
  }, [queryData]);

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return permissions;

    return permissions.filter(
      p =>
        p.key?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [permissions, searchQuery]);

  if (!user) return null;

  const handleOverrideChange = (permissionId: string, state: OverrideState) => {
    setLocalOverrides(prev => ({
      ...prev,
      [permissionId]: state,
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const formattedOverrides = Object.entries(localOverrides)
        .filter(([_, state]) => state !== "INHERIT")
        .map(([permissionId, state]) => ({
          permissionId,
          state,
        }));
      await onSave(userId, formattedOverrides);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const isDialogLoading = queryLoading || isLoading || isSaving;

  return (
    <Dialog
      open={open}
      onClose={isDialogLoading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="manage-overrides-dialog-title"
      slotProps={{
        paper: {
          sx: {
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        id="manage-overrides-dialog-title"
        sx={theme => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <Box>
          <Typography variant="headlineMd" sx={{ fontWeight: 600 }}>
            {t("editOverrides")}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}>
            Configuring explicit rules for {user.name} ({user.email})
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isDialogLoading} size="small">
          <CloseOutlined />
        </IconButton>
      </DialogTitle>

      {/* Main Content Layout */}
      <DialogContent sx={{ p: 0, display: "flex", flex: 1, minHeight: 0, flexDirection: { xs: "column", md: "row" } }}>
        {/* Left Sidebar - 25% width */}
        <Box
          sx={theme => ({
            width: { xs: "100%", md: "25%" },
            borderRight: { xs: "none", md: `1px solid ${theme.palette.divider}` },
            borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            bgcolor: theme.palette.surfaceContainerLow ?? "transparent",
            gap: 3,
          })}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Avatar
              src={user.avatarUrl ?? undefined}
              alt={user.name ?? ""}
              sx={theme => ({
                width: 80,
                height: 80,
                bgcolor: theme.palette.primaryContainer,
                color: theme.palette.onPrimaryContainer,
                fontSize: "2rem",
                fontWeight: 600,
              })}
            >
              {user.name
                ?.split(" ")
                .map(w => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="titleLg" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
                {user.email}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ width: "100%", textAlign: "left" }}>
            <Typography
              variant="bodyMd"
              sx={theme => ({
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: theme.palette.text.secondary,
                mb: 1.5,
                letterSpacing: "0.05em",
              })}
            >
              Current Groups
            </Typography>
            {userGroups.length === 0 ? (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.disabled, fontStyle: "italic" })}>
                No assigned groups
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {userGroups.map(g => (
                  <Box
                    key={g.id || g.slug}
                    sx={theme => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 2,
                      py: 1,
                      borderRadius: 1.5,
                      border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
                      bgcolor: theme.palette.secondaryContainer,
                      color: theme.palette.onSecondaryContainer,
                    })}
                  >
                    <Typography variant="bodyMd" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                      {g.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Content Area - 75% width */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Toolbar */}
          <Box
            sx={theme => ({
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            })}
          >
            {/* Segmented Toggle */}
            <Box
              sx={theme => ({
                display: "flex",
                p: 0.5,
                borderRadius: 2,
                bgcolor: theme.palette.surfaceContainerHigh ?? theme.palette.action.hover,
                border: `1px solid ${theme.palette.border?.light ?? theme.palette.divider}`,
              })}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => setMode("effective")}
                sx={theme => ({
                  px: 2,
                  py: 0.75,
                  borderRadius: 1.5,
                  fontWeight: mode === "effective" ? 600 : 500,
                  bgcolor: mode === "effective" ? theme.palette.primaryContainer : "transparent",
                  color: mode === "effective" ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
                  "&:hover": {
                    bgcolor: mode === "effective" ? theme.palette.primaryContainer : "transparent",
                  },
                })}
              >
                {t("effectivePermissions")}
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => setMode("edit")}
                sx={theme => ({
                  px: 2,
                  py: 0.75,
                  borderRadius: 1.5,
                  fontWeight: mode === "edit" ? 600 : 500,
                  bgcolor: mode === "edit" ? theme.palette.primaryContainer : "transparent",
                  color: mode === "edit" ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
                  "&:hover": {
                    bgcolor: mode === "edit" ? theme.palette.primaryContainer : "transparent",
                  },
                })}
              >
                Edit Overrides
              </Button>
            </Box>

            {/* Search Box */}
            <TextField
              size="small"
              placeholder="Filter permissions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: "100%", sm: 260 } }}
            />
          </Box>

          {/* Grid/Table Area */}
          <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {isDialogLoading && !permissions.length ? (
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

                      // Check group baseline
                      const baselineGroups = userGroups.filter(
                        g => (p.id && g.permissionIds?.includes(p.id)) || (p.key && g.permissionIds?.includes(p.key))
                      );
                      const isAllowedByGroup = baselineGroups.length > 0;
                      const baselineText = isAllowedByGroup
                        ? `Allowed via ${baselineGroups.map(g => g.name).join(", ")}`
                        : "Not Set";

                      // Override state
                      const overrideState: OverrideState = localOverrides[p.id] || "INHERIT";

                      // Effective state calculation
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
                              <Typography
                                variant="caption"
                                sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}
                              >
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
                                    bgcolor:
                                      overrideState === "INHERIT" ? theme.palette.primaryContainer : "transparent",
                                    color:
                                      overrideState === "INHERIT"
                                        ? theme.palette.onPrimaryContainer
                                        : theme.palette.text.secondary,
                                    borderColor: theme.palette.divider,
                                    "&:hover": {
                                      bgcolor:
                                        overrideState === "INHERIT" ? theme.palette.primaryContainer : "transparent",
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
                                      overrideState === "GRANTED"
                                        ? theme.palette.success.main
                                        : theme.palette.text.secondary,
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
                                      overrideState === "DENIED"
                                        ? theme.palette.error.main
                                        : theme.palette.text.secondary,
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
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={theme => ({ borderTop: `1px solid ${theme.palette.divider}`, px: 3, py: 2 })}>
        <Button
          onClick={onClose}
          disabled={isDialogLoading}
          variant="text"
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontWeight: 700,
            borderRadius: 1.5,
          })}
        >
          {t("cancel")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isDialogLoading}
          variant="contained"
          sx={theme => ({
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          })}
        >
          {isSaving ? <CircularProgress size={20} color="inherit" /> : "Save Overrides"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
