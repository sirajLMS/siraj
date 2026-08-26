"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ManageOverridesDialogSharedProps } from "@/frontend/common/views/dashboard/permissions/types/manageOverridesDialogShared.types";

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

const StyledDialogContent = styled(DialogContent, {
  shouldForwardProp: prop => prop !== "variant",
})<{ readonly variant: "desktop" | "mobile" }>(({ variant }) => ({
  padding: 0,
  display: "flex",
  flex: 1,
  minHeight: 0,
  flexDirection: variant === "desktop" ? "row" : "column",
}));

const StyledRightContentArea = styled(Box)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
});

export function ManageOverridesDialogShared({ labels, props, slots }: Readonly<ManageOverridesDialogSharedProps>) {
  const { open, onClose, manageOverridesState } = props;
  const t = labels;
  const { UserSidebar, Toolbar, DataGrid, Footer, dialogVariant, formIdSuffix, variant } = slots;

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
  } = manageOverridesState;

  if (!user) return null;

  const titleId = `manage-overrides-dialog-title-${formIdSuffix}`;

  return (
    <Dialog
      open={open}
      onClose={isDialogLoading ? undefined : onClose}
      aria-labelledby={titleId}
      fullWidth={dialogVariant.fullWidth}
      maxWidth={dialogVariant.maxWidth}
      fullScreen={dialogVariant.fullScreen}
      slotProps={dialogVariant.slotPropsPaperSx ? { paper: { sx: dialogVariant.slotPropsPaperSx } } : undefined}
    >
      <StyledDialogTitle id={titleId}>
        <Box>
          <Typography variant="headlineMd" sx={{ fontWeight: 600 }}>
            {t.editOverrides}
          </Typography>
          <StyledSubtitle variant="bodyMd">
            Configuring explicit rules for {user.name} ({user.email})
          </StyledSubtitle>
        </Box>
        <IconButton onClick={onClose} disabled={isDialogLoading} size="small" aria-label={t.cancel}>
          <CloseOutlined />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent variant={variant}>
        <UserSidebar labels={labels} user={user} userGroups={userGroups} />

        <StyledRightContentArea>
          <Toolbar
            labels={labels}
            mode={mode}
            onModeChange={setMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <DataGrid
            labels={labels}
            filteredPermissions={filteredPermissions}
            userGroups={userGroups}
            localOverrides={localOverrides}
            mode={mode}
            isDialogLoading={isDialogLoading}
            handleOverrideChange={handleOverrideChange}
          />
        </StyledRightContentArea>
      </StyledDialogContent>

      <Footer onClose={onClose} handleSave={handleSave} isDialogLoading={isDialogLoading} isSaving={isSaving} t={t} />
    </Dialog>
  );
}
