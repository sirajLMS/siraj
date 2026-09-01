import type React from "react";
import type { ManageOverridesState } from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";
import type { ManageOverridesDialogProps } from "@/frontend/common/views/dashboard/permissions/types/manageOverridesDialog.types";
import type { PermissionsLabels } from "@/shared/locale";

interface ManageOverridesDialogVariant {
  readonly fullWidth?: boolean;
  readonly maxWidth?: "xs" | "sm" | "md" | "lg";
  readonly fullScreen?: boolean;
  readonly slotPropsPaperSx?: Record<string, unknown>;
}

type ManageOverridesDialogVariantKind = "desktop" | "mobile";

interface ManageOverridesDialogSlotProps {
  readonly variant: ManageOverridesDialogVariantKind;
  readonly dialogVariant: ManageOverridesDialogVariant;
  readonly formIdSuffix: "desktop" | "mobile";
  readonly UserSidebar: React.ComponentType<{
    readonly labels: PermissionsLabels;
    readonly user: NonNullable<ManageOverridesState["user"]>;
    readonly userGroups: ManageOverridesState["userGroups"];
  }>;
  readonly Toolbar: React.ComponentType<{
    readonly labels: PermissionsLabels;
    readonly mode: ManageOverridesState["mode"];
    readonly onModeChange: ManageOverridesState["setMode"];
    readonly searchQuery: ManageOverridesState["searchQuery"];
    readonly onSearchChange: ManageOverridesState["setSearchQuery"];
  }>;
  readonly DataGrid: React.ComponentType<{
    readonly labels: PermissionsLabels;
    readonly filteredPermissions: ManageOverridesState["filteredPermissions"];
    readonly userGroups: ManageOverridesState["userGroups"];
    readonly localOverrides: ManageOverridesState["localOverrides"];
    readonly mode: ManageOverridesState["mode"];
    readonly isDialogLoading: ManageOverridesState["isDialogLoading"];
    readonly handleOverrideChange: ManageOverridesState["handleOverrideChange"];
  }>;
  readonly Footer: React.ComponentType<{
    readonly onClose: () => void;
    readonly handleSave: ManageOverridesState["handleSave"];
    readonly isDialogLoading: ManageOverridesState["isDialogLoading"];
    readonly isSaving: ManageOverridesState["isSaving"];
    readonly t: PermissionsLabels;
  }>;
}

export interface ManageOverridesDialogSharedProps {
  readonly labels: PermissionsLabels;
  readonly props: Readonly<Omit<ManageOverridesDialogProps, "labels">>;
  readonly slots: ManageOverridesDialogSlotProps;
}
