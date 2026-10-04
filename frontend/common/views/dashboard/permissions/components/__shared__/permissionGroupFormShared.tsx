"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogTitle, IconButton, Typography } from "@mui/material";
import type { ComponentType, ReactElement, ReactNode } from "react";
import type { LocalizedStringFormFieldProps } from "@/frontend/common/components/ui/input/localizedString/localizedStringFormFieldShared";
import {
  PermissionGroupFormActionsShared,
  PermissionGroupFormContentShared,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared.parts";
import type { PermissionGroupFormData } from "@/frontend/common/views/dashboard/permissions/schemas/permissionGroupSchema";
import type {
  PermissionCategoryListProps,
  PermissionFilterBarProps,
  PermissionGroupFormProps,
} from "@/frontend/common/views/dashboard/permissions/types";

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
