"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Permission, PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";
import { OverridesDialogFooter } from "./OverridesDialogFooter";
import { OverridesTable } from "./OverridesTable";
import { OverridesToolbar } from "./OverridesToolbar";
import { OverridesUserSidebar } from "./OverridesUserSidebar";
import { useManageOverridesState } from "./useManageOverridesState";

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

  const {
    user,
    userGroups,
    filteredPermissions,
    localOverrides,
    mode,
    searchQuery,
    isDialogLoading,
    isSaving,
    handleOverrideChange,
    handleSave,
    setMode,
    setSearchQuery,
  } = useManageOverridesState({ userId, users, groups, permissions, isLoading, open, onClose, onSave });

  if (!user) return null;

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

      <OverridesDialogFooter
        onClose={onClose}
        handleSave={handleSave}
        isDialogLoading={isDialogLoading}
        isSaving={isSaving}
        t={t}
      />
    </Dialog>
  );
}
