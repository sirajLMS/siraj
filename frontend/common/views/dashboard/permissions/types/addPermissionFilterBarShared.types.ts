import type React from "react";
import type { AddPermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types/addPermissionFilterBar.types";

export type AddPermissionFilterBarVariant = "desktop" | "mobile";

export interface AddPermissionFilterBarSlotProps {
  readonly variant: AddPermissionFilterBarVariant;
  readonly SearchSlot: React.ComponentType<Pick<AddPermissionFilterBarProps, "searchQuery" | "onSearchChange" | "t">>;
  readonly CategorySlot: React.ComponentType<
    Pick<AddPermissionFilterBarProps, "selectedCategory" | "onCategoryChange" | "addCategories" | "t">
  >;
}

export interface AddPermissionFilterBarSharedProps {
  readonly props: Readonly<AddPermissionFilterBarProps>;
  readonly slots: AddPermissionFilterBarSlotProps;
}
