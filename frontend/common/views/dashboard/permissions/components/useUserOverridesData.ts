// NEW FOR PLAN v5 (newly created for the migration wave)
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type { PermissionGroup, UserOverride } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
  readonly overrides: readonly UserOverride[];
  readonly info: UserOverrideInfo | null;
}

function buildConflictDetails(overrides: readonly UserOverride[], inheritedPermissionIds: Set<string>): string[] {
  const details: string[] = [];
  for (const override of overrides) {
    if (!override.permissionId) continue;
    const isInherited = inheritedPermissionIds.has(override.permissionId);
    if (override.state === "DENIED" && isInherited) {
      details.push(`Deny override for "${override.permissionId}" conflicts with inherited group permission.`);
    } else if (override.state === "GRANTED" && isInherited) {
      details.push(`Allow override for "${override.permissionId}" overlaps with inherited group permission.`);
    }
  }
  return details;
}

function computeInheritedPermissionIds(userGroups: readonly PermissionGroup[]): Set<string> {
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

function getUserGroupsForUser(userId: string, groups: readonly PermissionGroup[]): readonly PermissionGroup[] {
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
export function useUserOverridesData(userId: string, groups: readonly PermissionGroup[]): UserOverridesDataResult {
  const { data, loading, error } = useQuery(userOverridesQueryDocument, {
    variables: { userId },
    skip: !userId,
  });

  const overrides = useMemo<readonly UserOverride[]>(
    () => (data?.userOverrides ?? []) as readonly UserOverride[],
    [data]
  );

  const info = useMemo<UserOverrideInfo | null>(() => {
    if (!data?.userOverrides) return null;
    const overridesList = data.userOverrides as readonly UserOverride[];
    const grants = overridesList.filter(o => o.state === "GRANTED").length;
    const revokes = overridesList.filter(o => o.state === "DENIED").length;
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
