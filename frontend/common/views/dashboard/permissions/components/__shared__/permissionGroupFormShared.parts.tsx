"use client";

import { Box, Button, DialogActions, DialogContent, Grid } from "@mui/material";
import type {
  PermissionGroupFormSharedOptions,
  PermissionGroupFormSharedSlots,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared";
import type { PermissionGroupFormContentProps } from "@/frontend/common/views/dashboard/permissions/types";
import type { PermissionsLabels } from "@/shared/locale";

export function PermissionGroupFormActionsShared({
  isLoading,
  onClose,
  formId,
  t,
}: {
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly formId: string;
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
        form={formId}
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

export function PermissionGroupFormContentShared({
  control,
  isLoading,
  isSystem,
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
  options,
  slots,
}: Readonly<PermissionGroupFormContentProps> & {
  options: PermissionGroupFormSharedOptions;
  slots: PermissionGroupFormSharedSlots;
}) {
  const { SectionPanel, LocalizedStringFormField, PermissionFilterBar, PermissionCategoryList } = slots;

  return (
    <DialogContent dividers sx={{ p: 3 }}>
      <Box
        component="form"
        id={options.formId}
        onSubmit={handleSubmitForm}
        sx={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Grid container spacing={3}>
          <Grid size={options.gridItemSize}>
            <LocalizedStringFormField
              name="name"
              control={control}
              label={t.groupNameLabel}
              required
              disabled={isLoading || isSystem}
              fullWidth
            />
          </Grid>
          <Grid size={options.gridItemSize}>
            <LocalizedStringFormField
              name="description"
              control={control}
              label={t.descriptionLabel}
              multiline
              minRows={2}
              disabled={isLoading || isSystem}
              fullWidth
            />
          </Grid>
        </Grid>

        <SectionPanel title={t.addPermissions}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <PermissionFilterBar
              labels={t}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              selectedCount={selectedPermissionIds.length}
              isLoading={isLoading}
            />
            <PermissionCategoryList
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
        </SectionPanel>
      </Box>
    </DialogContent>
  );
}
