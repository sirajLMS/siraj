// NEW FOR PLAN v5 (newly created for the migration wave)
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import {
  OverrideState,
  type PermissionGroupDetailFieldsFragment,
  type UserOverridesQuery_userOverrides,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { userOverridesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";

export interface UserOverrideInfo {
  readonly grants: number;
  readonly revokes: number;
  readonly status: "healthy" | "conflict";
  readonly conflictDetails: string[];
}

export interface UserOverrideRowData {
  readonly loading: boolean;
  readonly info: UserOverrideInfo | null;
}

export interface UserOverridesDataResult {
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly overrides: readonly UserOverridesQuery_userOverrides[];
  readonly info: UserOverrideInfo | null;
}

function buildConflictDetails(
  overrides: readonly UserOverridesQuery_userOverrides[],
  inheritedPermissionIds: Set<string>
): string[] {
  const details: string[] = [];
  for (const override of overrides) {
    if (!override.permissionId) continue;
    const isInherited = inheritedPermissionIds.has(override.permissionId);
    if (override.state === OverrideState.Denied && isInherited) {
      details.push(`Deny override for "${override.permissionId}" conflicts with inherited group permission.`);
    } else if (override.state === OverrideState.Granted && isInherited) {
      details.push(`Allow override for "${override.permissionId}" overlaps with inherited group permission.`);
    }
  }
  return details;
}

function computeInheritedPermissionIds(userGroups: readonly PermissionGroupDetailFieldsFragment[]): Set<string> {
  const ids = new Set<string>();
  for (const group of userGroups) {
    if (group.permissionIds) {
      for (const pid of group.permissionIds) {
        ids.add(pid);
      }
    }
  }
  return ids;
}

function getUserGroupsForUser(
  userId: string,
  groups: readonly PermissionGroupDetailFieldsFragment[]
): readonly PermissionGroupDetailFieldsFragment[] {
  if (!userId) return [];
  return groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
}

/**
 * Fetches a single user's overrides via `userOverridesQueryDocument` and derives
 * the grants/revokes/conflict summary that the `UserOverridesDataGrid{Mobile,Desktop}`
 * tier row renderers consume.
 *
 * Lifted out of `userOverridesDataGrid.{mobile,desktop}.tsx` (NS-2 — N1 lift) so
 * the tier files receive already-computed `info` objects as props.
 */
export function useUserOverridesData(
  userId: string,
  groups: readonly PermissionGroupDetailFieldsFragment[]
): UserOverridesDataResult {
  const { data, loading, error } = useQuery(userOverridesQueryDocument, {
    variables: { userId },
    skip: !userId,
  });

  const overrides = useMemo<readonly UserOverridesQuery_userOverrides[]>(() => data?.userOverrides ?? [], [data]);

  const info = useMemo<UserOverrideInfo | null>(() => {
    if (!data?.userOverrides) return null;
    const overridesList = data.userOverrides as readonly UserOverridesQuery_userOverrides[];
    const grants = overridesList.filter(o => o.state === OverrideState.Granted).length;
    const revokes = overridesList.filter(o => o.state === OverrideState.Denied).length;
    const userGroups = getUserGroupsForUser(userId, groups);
    const inheritedPermissionIds = computeInheritedPermissionIds(userGroups);
    const conflictDetails = buildConflictDetails(overridesList, inheritedPermissionIds);
    return {
      grants,
      revokes,
      status: conflictDetails.length > 0 ? "conflict" : "healthy",
      conflictDetails,
    };
  }, [data, userId, groups]);

  return { loading, error, overrides, info };
}
