"use client";

import { CloseOutlined } from "@mui/icons-material";
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
import type { ComponentType, ReactElement, ReactNode } from "react";
import type { LocalizedStringFormFieldProps } from "@/frontend/common/components/ui/input/localizedString/localizedStringFormFieldShared";
import type { PermissionGroupFormData } from "@/frontend/common/views/dashboard/permissions/schemas/permissionGroupSchema";
import type {
  PermissionCategoryListProps,
  PermissionFilterBarProps,
  PermissionGroupFormContentProps,
  PermissionGroupFormProps,
} from "@/frontend/common/views/dashboard/permissions/types";
import type { PermissionsLabels } from "@/shared/locale";

export interface PermissionGroupFormSharedOptions {
  readonly formId: string;
  readonly gridItemSize: { readonly xs: number; readonly md?: number };
  readonly dialogProps: {
    readonly fullWidth?: boolean;
    readonly maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
    readonly fullScreen?: boolean;
  };
  readonly ariaLabelledBy: string;
}

export interface PermissionGroupFormSharedSlots {
  readonly SectionPanel: ComponentType<{ readonly title?: ReactNode; readonly children?: ReactNode }>;
  readonly LocalizedStringFormField: (props: LocalizedStringFormFieldProps<PermissionGroupFormData>) => ReactElement;
  readonly PermissionFilterBar: ComponentType<Readonly<PermissionFilterBarProps>>;
  readonly PermissionCategoryList: ComponentType<Readonly<PermissionCategoryListProps>>;
}

function PermissionGroupFormActionsShared({
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

function PermissionGroupFormContentShared({
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

export function PermissionGroupFormShared({
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
  options,
  slots,
}: Readonly<PermissionGroupFormProps> & {
  options: PermissionGroupFormSharedOptions;
  slots: PermissionGroupFormSharedSlots;
}) {
  const t = labels;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth={options.dialogProps.fullWidth}
      maxWidth={options.dialogProps.maxWidth}
      fullScreen={options.dialogProps.fullScreen}
      aria-labelledby={options.ariaLabelledBy}
    >
      <DialogTitle id={options.ariaLabelledBy}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="titleLg">{group ? t.editGroupTitle : t.createGroupTitle}</Typography>
          <IconButton onClick={onClose} disabled={isLoading} size="small" aria-label={t.cancel}>
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>

      <PermissionGroupFormContentShared
        control={control}
        isLoading={isLoading}
        isSystem={group?.isSystem ?? false}
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
          void handleSubmit(onSubmit)(e);
        }}
        t={t}
        options={options}
        slots={slots}
      />

      <PermissionGroupFormActionsShared isLoading={isLoading} onClose={onClose} formId={options.formId} t={t} />
    </Dialog>
  );
}
