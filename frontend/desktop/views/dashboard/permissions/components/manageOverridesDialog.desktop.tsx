"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useManageOverridesState } from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";
import { OverridesDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesDataGrid.desktop";
import { OverridesDialogFooterDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesDialogFooter.desktop";
import { OverridesToolbarDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesToolbar.desktop";
import { OverridesUserSidebarDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/overridesUserSidebar.desktop";
import { useAppTranslation } from "@/shared/locale";

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
  flexDirection: "row",
});

const StyledRightContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
});

interface ManageOverridesDialogDesktopProps {
  readonly open: boolean;
  readonly userId: string | null;
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onSave: (userId: string, overrides: Array<{ permissionId: string; state: string }>) => Promise<void>;
}

export function ManageOverridesDialogDesktop({
  open,
  userId,
  users,
  groups,
  permissions,
  isLoading,
  onClose,
  onSave,
}: Readonly<ManageOverridesDialogDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

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
      aria-labelledby="manage-overrides-dialog-title-desktop"
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
      <StyledDialogTitle id="manage-overrides-dialog-title-desktop">
        <Box>
          <Typography variant="headlineMd" sx={{ fontWeight: 600 }}>
            {t.editOverrides}
          </Typography>
          <StyledSubtitle variant="bodyMd">
            Configuring explicit rules for {user.name} ({user.email})
          </StyledSubtitle>
        </Box>
        <IconButton onClick={onClose} disabled={isDialogLoading} size="small">
          <CloseOutlined />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        <OverridesUserSidebarDesktop user={user} userGroups={userGroups} />

        <StyledRightContentArea>
          <OverridesToolbarDesktop
            mode={mode}
            onModeChange={setMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <OverridesDataGridDesktop
            filteredPermissions={filteredPermissions}
            userGroups={userGroups}
            localOverrides={localOverrides}
            mode={mode}
            isDialogLoading={isDialogLoading}
            handleOverrideChange={handleOverrideChange}
          />
        </StyledRightContentArea>
      </StyledDialogContent>

      <OverridesDialogFooterDesktop
        onClose={onClose}
        handleSave={handleSave}
        isDialogLoading={isDialogLoading}
        isSaving={isSaving}
        t={t}
      />
    </Dialog>
  );
}
