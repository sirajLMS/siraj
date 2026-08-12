import type { DeleteGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types/deleteGroupDialog.types";
import type { PermissionsLabels } from "@/shared/locale";

export interface DeleteGroupDialogVariant {
  readonly fullWidth?: boolean;
  readonly maxWidth?: "xs" | "sm" | "md";
  readonly fullScreen?: boolean;
}

export interface DeleteGroupDialogSlotProps {
  readonly dialogVariant: DeleteGroupDialogVariant;
  readonly formIdSuffix: "desktop" | "mobile";
}

export interface DeleteGroupDialogSharedProps {
  readonly labels: PermissionsLabels;
  readonly props: Readonly<Omit<DeleteGroupDialogProps, "labels">>;
  readonly slots: DeleteGroupDialogSlotProps;
}
