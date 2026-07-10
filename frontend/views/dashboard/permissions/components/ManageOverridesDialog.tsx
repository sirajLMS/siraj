"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import type { Permission, PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";
import { OverridesDialogFooter } from "@/frontend/views/dashboard/permissions/components/OverridesDialogFooter";
import { OverridesTable } from "@/frontend/views/dashboard/permissions/components/OverridesTable";
import { OverridesToolbar } from "@/frontend/views/dashboard/permissions/components/OverridesToolbar";
import { OverridesUserSidebar } from "@/frontend/views/dashboard/permissions/components/OverridesUserSidebar";
import { useManageOverridesState } from "@/frontend/views/dashboard/permissions/components/useManageOverridesState";

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

const StyledSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const StyledDialogContent = styled(DialogContent)({
  padding: 0,
  display: "flex",
  flex: 1,
  minHeight: 0,
  flexDirection: "column",
  "@media (min-width: 900px)": {
    flexDirection: "row",
  },
});

const StyledRightContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
});

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
      {/* Header */}
      <StyledDialogTitle id="manage-overrides-dialog-title">
        <Box>
          <Typography variant="headlineMd" sx={{ fontWeight: 600 }}>
            {t("editOverrides")}
          </Typography>
          <StyledSubtitle variant="bodyMd">
            Configuring explicit rules for {user.name} ({user.email})
          </StyledSubtitle>
        </Box>
        <IconButton onClick={onClose} disabled={isDialogLoading} size="small">
          <CloseOutlined />
        </IconButton>
      </StyledDialogTitle>

      {/* Sidebar + Content */}
      <StyledDialogContent>
        <OverridesUserSidebar user={user} userGroups={userGroups} />

        <StyledRightContentArea>
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
        </StyledRightContentArea>
      </StyledDialogContent>

      {/* Footer */}
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
