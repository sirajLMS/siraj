"use client";

import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import type {
  PermissionGroupFormContentProps,
  PermissionGroupFormProps,
} from "@/frontend/common/views/dashboard/permissions/types";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { LocalizedStringFormFieldMobile } from "@/frontend/mobile/components/ui/input/localizedString";
import { PermissionCategoryListMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCategoryList.mobile";
import { PermissionFilterBarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionFilterBar.mobile";
import type { PermissionsLabels } from "@/shared/locale";

function PermissionGroupFormActionsMobile({
  isLoading,
  onClose,
  t,
}: {
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly t: PermissionsLabels;
}) {
  return (
    <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
      <Button
        onClick={onClose}
        disabled={isLoading}
        variant="text"
        sx={theme => ({
          color: theme.palette.text.secondary,
          fontWeight: 700,
          borderRadius: 1.5,
        })}
      >
        {t.cancel}
      </Button>
      <Button
        type="submit"
        form="permission-group-form-mobile"
        disabled={isLoading}
        variant="contained"
        sx={theme => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          fontWeight: 700,
          borderRadius: 1.5,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
          },
        })}
      >
        {t.save}
      </Button>
    </DialogActions>
  );
}

function PermissionGroupFormContentMobile({
  control,
  isLoading,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  groupedPermissions,
  selectedPermissionIds,
  isGroupSelected,
  isGroupIndeterminate,
  handleSelectAllCategory,
  handleTogglePermission,
  handleSubmitForm,
  t,
}: Readonly<PermissionGroupFormContentProps>) {
  return (
    <DialogContent dividers sx={{ p: 3 }}>
      <Box
        component="form"
        id="permission-group-form-mobile"
        onSubmit={handleSubmitForm}
        sx={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <LocalizedStringFormFieldMobile
              name="name"
              control={control}
              label={t.groupNameLabel}
              required
              disabled={isLoading}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <LocalizedStringFormFieldMobile
              name="description"
              control={control}
              label={t.descriptionLabel}
              multiline
              minRows={2}
              disabled={isLoading}
              fullWidth
            />
          </Grid>
        </Grid>

        <MobileSectionPanel title={t.addPermissions}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <PermissionFilterBarMobile
              labels={t}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              selectedCount={selectedPermissionIds.length}
              isLoading={isLoading}
            />
            <PermissionCategoryListMobile
              groupedPermissions={groupedPermissions}
              selectedPermissionIds={selectedPermissionIds}
              isGroupSelected={isGroupSelected}
              isGroupIndeterminate={isGroupIndeterminate}
              onSelectAllCategory={handleSelectAllCategory}
              onTogglePermission={handleTogglePermission}
              isLoading={isLoading}
              t={t}
            />
          </Box>
        </MobileSectionPanel>
      </Box>
    </DialogContent>
  );
}

export function PermissionGroupFormMobile({
  labels,
  open,
  group,
  isLoading,
  onClose,
  control,
  handleSubmit,
  onSubmit,
  selectedPermissionIds,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  groupedPermissions,
  handleTogglePermission,
  handleSelectAllCategory,
  isGroupSelected,
  isGroupIndeterminate,
}: Readonly<PermissionGroupFormProps>) {
  const t = labels;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen
      aria-labelledby="permission-group-form-title-mobile"
    >
      <DialogTitle id="permission-group-form-title-mobile">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="titleLg">{group ? t.editGroupTitle : t.createGroupTitle}</Typography>
          <IconButton onClick={onClose} disabled={isLoading} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <PermissionGroupFormContentMobile
        control={control}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        groupedPermissions={groupedPermissions}
        selectedPermissionIds={selectedPermissionIds}
        isGroupSelected={isGroupSelected}
        isGroupIndeterminate={isGroupIndeterminate}
        handleSelectAllCategory={handleSelectAllCategory}
        handleTogglePermission={handleTogglePermission}
        handleSubmitForm={(e: React.SyntheticEvent<HTMLFormElement>) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        t={t}
      />

      <PermissionGroupFormActionsMobile isLoading={isLoading} onClose={onClose} t={t} />
    </Dialog>
  );
}
