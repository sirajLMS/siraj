// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PermissionGroupFormState } from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm";
import type { ValidPermission } from "@/frontend/common/views/dashboard/permissions/types/validPermission.types";
import type { PermissionsLabels } from "@/shared/locale";

// NEW FOR PLAN v5: NS-2 lifted `useForm`/`zodResolver`/`useEffect`/react-hook-form
// `control`/`setValue`/`useWatch` data flow OUT of the tier component, into the
// common `usePermissionGroupForm` hook. Tier files consume the form state as
// plain props (specs §6.2 — ViewModel owns the form). The `onSave` callback is
// supplied to the hook by the ViewModel; the tier dialog invokes
// `handleSubmit(onSubmit)` (both lifted from the hook).
export interface PermissionGroupFormProps extends PermissionGroupFormState {
  readonly labels: PermissionsLabels;
  readonly open: boolean;
  readonly group: PermissionGroup | null;
  readonly permissions: readonly Permission[];
  readonly isLoading: boolean;
  readonly onClose: () => void;
}

// NEW FOR PLAN v5: lifted-from-tier sub-component props (paired duplicate
// triclassified Class B per specs §4.1 — the mobile
// `PermissionGroupFormContentMobileProps` and the desktop
// `PermissionGroupFormContentDesktopProps` had byte-identical bodies). Both
// tier `permissionGroupForm.{mobile,desktop}.tsx` files consume this common
// type for their internal `PermissionGroupFormContent{Mobile,Desktop}` render
// helper components.
export interface PermissionGroupFormContentProps {
  readonly control: PermissionGroupFormProps["control"];
  readonly isLoading: boolean;
  readonly searchTerm: string;
  readonly setSearchTerm: (v: string) => void;
  readonly selectedCategory: string;
  readonly setSelectedCategory: (v: string) => void;
  readonly categories: readonly string[];
  readonly groupedPermissions: Record<string, ValidPermission[]>;
  readonly selectedPermissionIds: string[];
  readonly isGroupSelected: (perms: ReadonlyArray<Permission & { id: string }>) => boolean;
  readonly isGroupIndeterminate: (perms: ReadonlyArray<Permission & { id: string }>) => boolean;
  readonly handleSelectAllCategory: (perms: ReadonlyArray<Permission & { id: string }>, checked: boolean) => void;
  readonly handleTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly handleSubmitForm: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly t: PermissionsLabels;
}

export type { ValidPermission };
