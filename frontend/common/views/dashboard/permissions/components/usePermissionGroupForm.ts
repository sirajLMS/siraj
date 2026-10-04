import { zodResolver } from "@hookform/resolvers/zod";
import { type Control, type UseFormHandleSubmit, type UseFormSetValue, useForm, useWatch } from "react-hook-form";
import type {
  PermissionsQuery_permissions as Permission,
  PermissionGroupsQuery_permissionGroups as PermissionGroup,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import {
  applyCategorySelection,
  isCategoryFullySelected,
  isCategoryIndeterminate,
  type SelectablePermission,
  togglePermissionId,
} from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm.helpers";
import {
  useDialogOpenReset,
  usePermissionFormFilters,
} from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm.hooks";
import {
  type PermissionGroupFormData,
  permissionGroupSchema,
} from "@/frontend/common/views/dashboard/permissions/schemas/permissionGroupSchema";
import type { ValidPermission } from "@/frontend/common/views/dashboard/permissions/types/validPermission.types";

export interface PermissionGroupFormState {
  readonly control: Control<PermissionGroupFormData>;
  readonly setValue: UseFormSetValue<PermissionGroupFormData>;
  readonly handleSubmit: UseFormHandleSubmit<PermissionGroupFormData>;
  readonly onSubmit: (data: PermissionGroupFormData) => Promise<void>;
  readonly selectedPermissionIds: string[];
  readonly searchTerm: string;
  readonly setSearchTerm: (term: string) => void;
  readonly selectedCategory: string;
  readonly setSelectedCategory: (category: string) => void;
  readonly categories: string[];
  readonly groupedPermissions: Record<string, ValidPermission[]>;
  readonly handleTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly handleSelectAllCategory: (categoryPerms: readonly SelectablePermission[], checked: boolean) => void;
  readonly isGroupSelected: (categoryPerms: readonly SelectablePermission[]) => boolean;
  readonly isGroupIndeterminate: (categoryPerms: readonly SelectablePermission[]) => boolean;
}

interface UsePermissionGroupFormParams {
  readonly open: boolean;
  readonly group: PermissionGroup | null;
  readonly permissions: readonly Permission[];
  readonly onSave: (
    name: PermissionGroupFormData["name"],
    description: PermissionGroupFormData["description"],
    permissionIds: string[]
  ) => Promise<void>;
}

/**
 * Common hook owning the entire Permission Group create/edit form:
 * - `useForm` + `zodResolver(permissionGroupSchema)` validation
 * - the dialog-open reset effect
 * - the cross-tier `searchTerm` + `selectedCategory` filter state stored in
 *   `permissionManagementStore` (survives tier switches)
 * - permission filtering and category selection helpers
 *
 * The tier `permissionGroupForm.{mobile,desktop}.tsx` files consume the
 * returned bag as props and render against it — no own state.
 */
export function usePermissionGroupForm({
  open,
  group,
  permissions,
  onSave,
}: UsePermissionGroupFormParams): PermissionGroupFormState {
  const searchTerm = usePermissionManagementStore(s => s.permissionGroupFormSearchTerm);
  const selectedCategory = usePermissionManagementStore(s => s.permissionGroupFormSelectedCategory);
  const setSearchTerm = usePermissionManagementStore(s => s.setPermissionGroupFormSearchTerm);
  const setSelectedCategory = usePermissionManagementStore(s => s.setPermissionGroupFormSelectedCategory);

  const { control, handleSubmit, setValue, reset } = useForm<PermissionGroupFormData>({
    resolver: zodResolver(permissionGroupSchema),
    defaultValues: {
      name: {},
      description: {},
      permissionIds: [],
    },
  });

  useDialogOpenReset({ open, group, reset, setSearchTerm, setSelectedCategory });

  const selectedPermissionIds = useWatch({ control, name: "permissionIds" }) ?? [];

  const handleTogglePermission = (permId: string, isSystem: boolean) => {
    const next = togglePermissionId(selectedPermissionIds, permId, isSystem);
    if (next !== null) {
      setValue("permissionIds", next);
    }
  };

  const handleSelectAllCategory = (categoryPerms: readonly SelectablePermission[], checked: boolean) => {
    setValue("permissionIds", applyCategorySelection(selectedPermissionIds, categoryPerms, checked));
  };

  const isGroupSelected = (categoryPerms: readonly SelectablePermission[]) =>
    isCategoryFullySelected(selectedPermissionIds, categoryPerms);

  const isGroupIndeterminate = (categoryPerms: readonly SelectablePermission[]) =>
    isCategoryIndeterminate(selectedPermissionIds, categoryPerms);

  const { categories, groupedPermissions } = usePermissionFormFilters(permissions, searchTerm, selectedCategory);

  const onSubmit = async (data: PermissionGroupFormData) => {
    await onSave(data.name, data.description ?? {}, data.permissionIds);
  };

  return {
    control,
    setValue,
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
  };
}
