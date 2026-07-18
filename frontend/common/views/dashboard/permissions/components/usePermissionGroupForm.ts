// NEW FOR PLAN v5 (newly created for the migration wave)
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { type Control, type UseFormHandleSubmit, type UseFormSetValue, useForm, useWatch } from "react-hook-form";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import {
  type PermissionGroupFormData,
  permissionGroupSchema,
} from "@/frontend/common/views/dashboard/permissions/schemas/permissionGroupSchema";
import type { ValidPermission } from "@/frontend/common/views/dashboard/permissions/types/validPermission.types";
import { useAppTranslation } from "@/shared/locale";

export type { ValidPermission };

type SelectablePermission = Permission & { id: string };

export interface GroupedPermissions {
  readonly categories: string[];
  readonly groupedPermissions: Record<string, ValidPermission[]>;
}

export interface PermissionGroupSelection {
  readonly selectedPermissionIds: string[];
  readonly handleTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly handleSelectAllCategory: (categoryPerms: readonly SelectablePermission[], checked: boolean) => void;
  readonly isGroupSelected: (categoryPerms: readonly SelectablePermission[]) => boolean;
  readonly isGroupIndeterminate: (categoryPerms: readonly SelectablePermission[]) => boolean;
}

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

function usePermissionFormFilters(
  permissions: readonly Permission[],
  searchTerm: string,
  selectedCategory: string
): GroupedPermissions {
  const t = useAppTranslation().dashboardTranslations.permissions;

  const validPermissions = useMemo(
    () => permissions.filter((p): p is ValidPermission => !!p.id && !!p.key && !!p.category),
    [permissions]
  );

  const categories = useMemo(() => {
    const cats = validPermissions.map(p => p.category).filter((c): c is string => c.trim() !== "");
    return Array.from(new Set(cats));
  }, [validPermissions]);

  const filteredPermissions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return validPermissions.filter(perm => {
      const matchesSearch =
        perm.key.toLowerCase().includes(q) || (perm.description?.toLowerCase().includes(q) ?? false);
      const matchesCategory = selectedCategory === "ALL" || perm.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [validPermissions, searchTerm, selectedCategory]);

  const groupedPermissions = useMemo(
    () =>
      filteredPermissions.reduce<Record<string, ValidPermission[]>>((acc, perm) => {
        const cat = perm.category || t.allCategoriesOption;
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(perm);
        return acc;
      }, {}),
    [filteredPermissions, t]
  );

  return { categories, groupedPermissions };
}

/**
 * Common hook owning the entire Permission Group create/edit form:
 * - `useForm` + `zodResolver(permissionGroupSchema)` (lifted per N4 + N26)
 * - `useEffect` to reset the form when the dialog opens (lifted per N6)
 * - the cross-tier `searchTerm` + `selectedCategory` filter state stored in
 *   `permissionManagementStore` (lifted per N7 — survives tier switches)
 * - `usePermissionFormFilters` + selection helpers (lifted per N25 — they were
 *   previously inline `function useX(...)` declarations duplicated inside both
 *   tier views)
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

  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          name: (group.name ?? {}) as PermissionGroupFormData["name"],
          description: (group.description ?? {}) as PermissionGroupFormData["description"],
          permissionIds: (group.permissionIds ?? []).filter((id): id is string => !!id),
        });
      } else {
        reset({ name: {}, description: {}, permissionIds: [] });
      }
      setSearchTerm("");
      setSelectedCategory("ALL");
    }
  }, [open, group, reset, setSearchTerm, setSelectedCategory]);

  const selectedPermissionIds = useWatch({ control, name: "permissionIds" }) ?? [];

  const handleTogglePermission = (permId: string, isSystem: boolean) => {
    if (isSystem) return;
    if (selectedPermissionIds.includes(permId)) {
      setValue(
        "permissionIds",
        selectedPermissionIds.filter(id => id !== permId)
      );
    } else {
      setValue("permissionIds", [...selectedPermissionIds, permId]);
    }
  };

  const handleSelectAllCategory = (categoryPerms: readonly SelectablePermission[], checked: boolean) => {
    const modifiablePerms = categoryPerms.filter(p => !p.isSystem);
    const modifiableIds = modifiablePerms.map(p => p.id);
    if (checked) {
      const merged = Array.from(new Set([...selectedPermissionIds, ...modifiableIds]));
      setValue("permissionIds", merged);
    } else {
      setValue(
        "permissionIds",
        selectedPermissionIds.filter(id => !modifiableIds.includes(id))
      );
    }
  };

  const isGroupSelected = (categoryPerms: readonly SelectablePermission[]) => {
    const modifiablePerms = categoryPerms.filter(p => !p.isSystem);
    if (modifiablePerms.length === 0) return false;
    return modifiablePerms.every(p => selectedPermissionIds.includes(p.id));
  };

  const isGroupIndeterminate = (categoryPerms: readonly SelectablePermission[]) => {
    const modifiablePerms = categoryPerms.filter(p => !p.isSystem);
    if (modifiablePerms.length === 0) return false;
    const selectedInCategory = modifiablePerms.filter(p => selectedPermissionIds.includes(p.id));
    return selectedInCategory.length > 0 && selectedInCategory.length < modifiablePerms.length;
  };

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
