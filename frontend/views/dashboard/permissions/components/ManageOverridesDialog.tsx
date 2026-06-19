"use client";

import { useQuery } from "@apollo/client/react";
import { CloseOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { Permission, PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";
import { userOverridesQueryDocument } from "@/frontend/graphql/sharedDocuments/permission-management.documents";
import { type OverrideState, OverridesTable } from "./OverridesTable";
import { OverridesToolbar } from "./OverridesToolbar";
import { OverridesUserSidebar } from "./OverridesUserSidebar";

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

      <DialogContent sx={{ p: 0, display: "flex", flex: 1, minHeight: 0, flexDirection: { xs: "column", md: "row" } }}>
        <OverridesUserSidebar user={user} userGroups={userGroups} />

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <OverridesToolbar
            mode={mode}
            onModeChange={setMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <OverridesTable
            filteredPermissions={filteredPermissions}
            userGroups={userGroups}
            localOverrides={localOverrides}
            mode={mode}
            isDialogLoading={isDialogLoading}
            handleOverrideChange={handleOverrideChange}
          />
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
