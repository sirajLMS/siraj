// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";

/**
 * Returns the subset of `groups` whose `assignedUsers` collection includes
 * the given `userId`. Lifted out of both tier `userOverridesDataGrid.*.tsx`
 * files (NS-2 — N9 lift) — pure-data helper belongs in common utils per
 * specs §5.
 */
export function getUserGroupsForUser(
  userId: string | undefined,
  groups: readonly PermissionGroup[]
): readonly PermissionGroup[] {
  if (!userId) return [];
  return groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
}
