// NEW FOR PLAN v5 (newly created for the migration wave)
import type {
  PermissionGroupDetailFieldsFragment,
  PermissionGroupDetailFieldsFragment_assignedUsers,
} from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Returns the subset of `groups` whose `assignedUsers` collection includes
 * the given `userId`. Lifted out of both tier `userOverridesDataGrid.*.tsx`
 * files (NS-2 — N9 lift) — pure-data helper belongs in common utils per
 * specs §5.
 */
export function getUserGroupsForUser(
  userId: string | undefined,
  groups: readonly PermissionGroupDetailFieldsFragment[]
): readonly PermissionGroupDetailFieldsFragment[] {
  if (!userId) return [];
  return groups.filter(g =>
    g.assignedUsers?.some((au: PermissionGroupDetailFieldsFragment_assignedUsers) => au.id === userId)
  );
}
