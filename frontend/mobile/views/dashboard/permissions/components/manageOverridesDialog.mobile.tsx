"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useManageOverridesState } from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";
import { OverridesDataGridMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesDataGrid.mobile";
import { OverridesDialogFooterMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesDialogFooter.mobile";
import { OverridesToolbarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesToolbar.mobile";
import { OverridesUserSidebarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/overridesUserSidebar.mobile";
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
  flexDirection: "column",
});

const StyledRightContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
});

interface ManageOverridesDialogMobileProps {
  readonly open: boolean;
  readonly userId: string | null;
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onSave: (userId: string, overrides: Array<{ permissionId: string; state: string }>) => Promise<void>;
}

export function ManageOverridesDialogMobile({
  open,
  userId,
  users,
  groups,
  permissions,
  isLoading,
  onClose,
  onSave,
}: Readonly<ManageOverridesDialogMobileProps>) {
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
      fullScreen
      aria-labelledby="manage-overrides-dialog-title-mobile"
    >
      <StyledDialogTitle id="manage-overrides-dialog-title-mobile">
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
        <OverridesUserSidebarMobile user={user} userGroups={userGroups} />

        <StyledRightContentArea>
          <OverridesToolbarMobile
            mode={mode}
            onModeChange={setMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <OverridesDataGridMobile
            filteredPermissions={filteredPermissions}
            userGroups={userGroups}
            localOverrides={localOverrides}
            mode={mode}
            isDialogLoading={isDialogLoading}
            handleOverrideChange={handleOverrideChange}
          />
        </StyledRightContentArea>
      </StyledDialogContent>

      <OverridesDialogFooterMobile
        onClose={onClose}
        handleSave={handleSave}
        isDialogLoading={isDialogLoading}
        isSaving={isSaving}
        t={t}
      />
    </Dialog>
  );
}
