import type { PermissionGroupFormSharedOptions } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared";

export const DESKTOP_OPTIONS: PermissionGroupFormSharedOptions = {
  formId: "permission-group-form-desktop",
  gridItemSize: { xs: 12, md: 6 },
  dialogProps: {
    fullWidth: true,
    maxWidth: "md",
  },
  ariaLabelledBy: "permission-group-form-title-desktop",
};

export const MOBILE_OPTIONS: PermissionGroupFormSharedOptions = {
  formId: "permission-group-form-mobile",
  gridItemSize: { xs: 12 },
  dialogProps: {
    fullScreen: true,
  },
  ariaLabelledBy: "permission-group-form-title-mobile",
};
