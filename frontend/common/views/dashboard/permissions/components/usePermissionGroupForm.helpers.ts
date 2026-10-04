import type {
  PermissionsQuery_permissions as Permission,
  PermissionGroupsQuery_permissionGroups as PermissionGroup,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionGroupFormData } from "@/frontend/common/views/dashboard/permissions/schemas/permissionGroupSchema";
import type { ValidPermission } from "@/frontend/common/views/dashboard/permissions/types/validPermission.types";

export type SelectablePermission = Permission & { id: string };

export interface GroupedPermissions {
  readonly categories: string[];
  readonly groupedPermissions: Record<string, ValidPermission[]>;
}

export function buildPermissionGroupInitialValues(group: PermissionGroup | null): PermissionGroupFormData {
  if (!group) {
    return { name: {}, description: {}, permissionIds: [] };
  }
  return {
    name: group.name ?? {},
    description: group.description ?? {},
    permissionIds: (group.permissionIds ?? []).filter((id): id is string => !!id),
  };
}

export function togglePermissionId(selectedIds: readonly string[], permId: string, isSystem: boolean): string[] | null {
  if (isSystem) return null;
  if (selectedIds.includes(permId)) {
    return selectedIds.filter(id => id !== permId);
  }
  return [...selectedIds, permId];
}

export function applyCategorySelection(
  selectedIds: readonly string[],
  categoryPerms: readonly SelectablePermission[],
  checked: boolean
): string[] {
  const modifiableIds = categoryPerms.filter(p => !p.isSystem).map(p => p.id);
  if (checked) {
    return Array.from(new Set([...selectedIds, ...modifiableIds]));
  }
  return selectedIds.filter(id => !modifiableIds.includes(id));
}

function getModifiableInCategory(categoryPerms: readonly SelectablePermission[]): readonly SelectablePermission[] {
  return categoryPerms.filter(p => !p.isSystem);
}

export function isCategoryFullySelected(
  selectedIds: readonly string[],
  categoryPerms: readonly SelectablePermission[]
): boolean {
  const modifiable = getModifiableInCategory(categoryPerms);
  if (modifiable.length === 0) return false;
  return modifiable.every(p => selectedIds.includes(p.id));
}

export function isCategoryIndeterminate(
  selectedIds: readonly string[],
  categoryPerms: readonly SelectablePermission[]
): boolean {
  const modifiable = getModifiableInCategory(categoryPerms);
  if (modifiable.length === 0) return false;
  const selectedInCategory = modifiable.filter(p => selectedIds.includes(p.id));
  return selectedInCategory.length > 0 && selectedInCategory.length < modifiable.length;
}
