import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  hasItemPermission,
  isParentPortalUser,
  isStudentPortalUser,
  isSuperAdminNavUser,
  isSupervisorPortalUser,
  isTeacherPortalUser,
  SUPERADMIN_HIDDEN_SUPERVISOR_KEYS,
} from "@/frontend/common/views/dashboard/config/navigationAccess";
import type { NavFeatureFlags } from "@/frontend/common/views/dashboard/config/navigationFeatureFlags";
import {
  applyParentNavOverrides,
  applyProfileNavOverrides,
  applyStudentNavOverrides,
  applySupervisorNavOverrides,
  applyTeacherNavOverrides,
} from "@/frontend/common/views/dashboard/config/navigationOverrides";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

function applyUsersDirectoryNavOverrides(items: readonly NavItem[], featureFlags: NavFeatureFlags): NavItem[] {
  const directoryKeys = new Set(["teachers", "parents", "students", "staff"]);
  if (featureFlags.enableUsersDirectory) {
    return items.filter(item => !directoryKeys.has(item.key));
  }
  return items.filter(item => item.key !== "users-directory");
}

/**
 * Returns the subset of NAV ITEMS that survive the user's permission +
 * audience gate + per-portal overrides. The same predicate is reused for both
 * the sidebar and the mobile bottom nav (which administers its own flat list).
 */
export function filterNavItemsForPermissions(
  items: readonly NavItem[],
  permissions: readonly AppPermission[],
  featureFlags: NavFeatureFlags
): NavItem[] {
  const filtered = items.filter(item => {
    // Next.js App Router Link rejects unresolved dynamic segments
    // (e.g. `/quotas/[id]`). Detail routes must be linked with a real id.
    if (item.href.includes("[")) {
      return false;
    }
    if (item.audience === "teacher" && !isTeacherPortalUser(permissions)) return false;
    if (item.audience === "parent" && !isParentPortalUser(permissions)) return false;
    if (item.audience === "student" && !isStudentPortalUser(permissions)) return false;
    // SUPERADMIN sees the supervisor-only items, EXCEPT `supervisor-home`
    // because the admin `home` item already serves `/dashboard`. A
    // non-SUPERADMIN without SupervisorViewDashboard never sees supervisor
    // items at all.
    if (item.audience === "supervisor") {
      if (!isSupervisorPortalUser(permissions) && !isSuperAdminNavUser(permissions)) {
        return false;
      }
      if (isSuperAdminNavUser(permissions) && !isSupervisorPortalUser(permissions)) {
        return !SUPERADMIN_HIDDEN_SUPERVISOR_KEYS.has(item.key);
      }
    }
    if (!hasItemPermission(item, permissions)) {
      return false;
    }
    return true;
  });

  return applyProfileNavOverrides(
    applySupervisorNavOverrides(
      applyStudentNavOverrides(
        applyParentNavOverrides(
          applyTeacherNavOverrides(applyUsersDirectoryNavOverrides(filtered, featureFlags), permissions),
          permissions
        ),
        permissions
      ),
      permissions
    ),
    permissions
  );
}

/**
 * Group filtering: a group is dropped when it has no surviving children OR
 * when the group itself is gated against the user. Empty groups never
 * surface — portals don't see empty headers in the sidebar.
 */
export function filterNavGroupsForPermissions(
  groups: readonly NavGroup[],
  items: readonly NavItem[],
  permissions: readonly AppPermission[],
  featureFlags: NavFeatureFlags
): NavGroup[] {
  // 1) Filter items (single pass, exactly the same logic as the item filter).
  const filteredItems = filterNavItemsForPermissions(items, permissions, featureFlags);

  // 2) Keep a group when (a) it passes its own audience+permission gate AND
  //    (b) it has at least one surviving child item.
  const itemKeysByGroup = new Map<string, string[]>();
  for (const item of filteredItems) {
    if (!item.groupId) {
      continue;
    }
    const arr = itemKeysByGroup.get(item.groupId);
    if (arr) {
      arr.push(item.key);
    } else {
      itemKeysByGroup.set(item.groupId, [item.key]);
    }
  }

  const survivingGroups = groups.filter(group => {
    if (group.audience === "teacher" && !isTeacherPortalUser(permissions)) return false;
    if (group.audience === "parent" && !isParentPortalUser(permissions)) return false;
    if (group.audience === "student" && !isStudentPortalUser(permissions)) return false;
    if (group.audience === "supervisor" && !isSupervisorPortalUser(permissions) && !isSuperAdminNavUser(permissions))
      return false;
    if (group.permission) {
      const hasGroupPermission =
        typeof group.permission === "string"
          ? permissions.includes(group.permission)
          : group.permission.some(p => permissions.includes(p));
      if (!hasGroupPermission) {
        return false;
      }
    }
    const children = itemKeysByGroup.get(group.id);
    return children !== undefined && children.length > 0;
  });

  return survivingGroups;
}
