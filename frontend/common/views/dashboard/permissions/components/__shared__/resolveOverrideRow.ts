import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import type { PermissionsLabels } from "@/shared/locale";

export type EffectiveState = "allowed" | "denied" | "not_set";

export interface OverrideRowData {
  readonly baselineGroups: readonly PermissionGroup[];
  readonly isAllowedByGroup: boolean;
  readonly baselineText: string;
  readonly overrideState: OverrideState;
  readonly effectiveState: EffectiveState;
}

export function resolveOverrideRow(
  permission: Permission,
  userGroups: readonly PermissionGroup[],
  localOverrides: Record<string, OverrideState>,
  t: PermissionsLabels,
  locale: string
): OverrideRowData {
  const baselineGroups = userGroups.filter(
    g =>
      (permission.id && g.permissionIds?.includes(permission.id)) ||
      (permission.key && g.permissionIds?.includes(permission.key))
  );
  const isAllowedByGroup = baselineGroups.length > 0;
  const baselineText = isAllowedByGroup
    ? t.allowedViaGroups(baselineGroups.map(g => resolveLocalizedString(g.name, locale) || g.slug || "").join(", "))
    : t.notSet;
  const overrideState: OverrideState = (permission.id && localOverrides[permission.id]) || "INHERIT";

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
