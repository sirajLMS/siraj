import type { AddPermissionBulkBarProps } from "@/frontend/common/views/dashboard/permissions/types/addPermissionBulkBar.types";

type AddPermissionBulkBarVariant = "desktop" | "mobile";

export interface AddPermissionBulkBarSharedProps extends AddPermissionBulkBarProps {
  readonly variant: AddPermissionBulkBarVariant;
}
