import type {
  PermissionGroupsQuery_permissionGroups,
  PermissionsQuery_permissions,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import type { PermissionsLabels } from "@/shared/locale";

type EffectiveState = "allowed" | "denied" | "not_set";

export interface OverrideRowData {
  readonly baselineGroups: readonly PermissionGroupsQuery_permissionGroups[];
  readonly isAllowedByGroup: boolean;
  readonly baselineText: string;
  readonly overrideState: OverrideState;
  readonly effectiveState: EffectiveState;
}

export function resolveOverrideRow(
  permission: PermissionsQuery_permissions,
  userGroups: readonly PermissionGroupsQuery_permissionGroups[],
  localOverrides: Record<string, OverrideState>,
  t: PermissionsLabels,
  locale: string
): OverrideRowData {
  const baselineGroups = userGroups.filter(
    g =>
      Boolean(permission.id && g.permissionIds?.includes(permission.id)) ||
      Boolean(permission.key && g.permissionIds?.includes(permission.key))
  );
  const isAllowedByGroup = baselineGroups.length > 0;
  const baselineText = isAllowedByGroup
    ? t.allowedViaGroups(baselineGroups.map(g => (resolveLocalizedString(g.name, locale) || g.slug) ?? "").join(", "))
    : t.notSet;
  const overrideState: OverrideState = localOverrides[permission.id ?? ""] ?? "INHERIT";

  let effectiveState: EffectiveState;
  if (overrideState === "GRANTED") {
    effectiveState = "allowed";
  } else if (overrideState === "DENIED") {
    effectiveState = "denied";
  } else if (isAllowedByGroup) {
    effectiveState = "allowed";
  } else {
    effectiveState = "not_set";
  }

  return { baselineGroups, isAllowedByGroup, baselineText, overrideState, effectiveState };
}
