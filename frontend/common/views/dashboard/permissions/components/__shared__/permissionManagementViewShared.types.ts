import type { ComponentType, ReactNode } from "react";
import type {
  PermissionManagementDialogsProps,
  PermissionTabContentProps,
  SingleGroupViewProps,
} from "@/frontend/common/views/dashboard/permissions/types";
import type { PermissionManagementViewModel } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";

export interface PermissionManagementViewSharedOptions {
  readonly contentSx: { readonly mt: number; readonly gap: number };
}

interface PageHeaderSlotProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
}

interface PrimaryPageActionSlotProps {
  readonly id?: string;
  readonly onClick?: () => void;
  readonly children?: ReactNode;
}

interface PermissionManagementViewSharedSlots {
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: ComponentType<PageHeaderSlotProps>;
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionSlotProps>;
  readonly SingleGroupView: ComponentType<Readonly<SingleGroupViewProps>>;
  readonly PermissionTabContent: ComponentType<Readonly<PermissionTabContentProps>>;
  readonly PermissionManagementDialogs: ComponentType<Readonly<PermissionManagementDialogsProps>>;
}

interface PermissionManagementViewSharedProps {
  readonly options: PermissionManagementViewSharedOptions;
  readonly slots: PermissionManagementViewSharedSlots;
}

export type PermissionManagementViewSharedInput = Readonly<PermissionManagementViewModel> &
  PermissionManagementViewSharedProps;

export type RenderContext = Pick<
  PermissionManagementViewModel,
  | "labels"
  | "permissions"
  | "isLoading"
  | "error"
  | "activeTab"
  | "activeGroup"
  | "groups"
  | "users"
  | "setActiveTab"
  | "setSelectedGroupId"
  | "openEditDialog"
  | "openDeleteDialog"
  | "openAssignDialog"
  | "openManageOverrides"
  | "setSelectedUserIdForOverrides"
  | "catalogFilter"
  | "groupRowMenuAnchor"
  | "singleGroupState"
  | "openCreateDialog"
> &
  PermissionManagementViewSharedProps;

export type DialogContext = Pick<
  PermissionManagementViewModel,
  | "labels"
  | "isLoading"
  | "activeGroup"
  | "selectedGroupId"
  | "isCreateDialogOpen"
  | "isEditDialogOpen"
  | "isDeleteDialogOpen"
  | "isAssignDialogOpen"
  | "isManageOverridesOpen"
  | "closeCreateDialog"
  | "closeEditDialog"
  | "closeDeleteDialog"
  | "closeAssignDialog"
  | "closeManageOverrides"
  | "setSelectedUserIdForOverrides"
  | "onDeleteGroup"
  | "onAssignGroup"
  | "createGroupForm"
  | "editGroupForm"
  | "assignGroupForm"
  | "manageOverridesState"
> & {
  readonly slots: PermissionManagementViewSharedSlots;
};
