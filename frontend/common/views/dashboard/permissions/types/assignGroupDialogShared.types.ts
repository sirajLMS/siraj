import type React from "react";
import type { UserAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect";
import type { AssignGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types/assignGroupDialog.types";
import type { PermissionsLabels } from "@/shared/locale";

export type AssignGroupUserAutocompleteSlot = React.ComponentType<UserAutocompleteProps>;

export interface AssignGroupDialogVariant {
  readonly fullWidth?: boolean;
  readonly maxWidth?: "xs" | "sm" | "md";
  readonly fullScreen?: boolean;
}

export interface AssignGroupDialogSlotProps {
  readonly labels: PermissionsLabels;
  readonly UserAutocomplete: AssignGroupUserAutocompleteSlot;
  readonly dialogVariant: AssignGroupDialogVariant;
  readonly formIdSuffix: "desktop" | "mobile";
}

export interface AssignGroupDialogSharedProps {
  readonly labels: PermissionsLabels;
  readonly props: Readonly<Omit<AssignGroupDialogProps, "labels">>;
  readonly slots: AssignGroupDialogSlotProps;
}
