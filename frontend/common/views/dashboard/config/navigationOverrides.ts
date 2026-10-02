import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  isParentPortalUser,
  isStudentPortalUser,
  isSupervisorPortalUser,
  isTeacherPortalUser,
} from "@/frontend/common/views/dashboard/config/navigationAccess";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

export function applyProfileNavOverrides(items: readonly NavItem[], _permissions: readonly AppPermission[]): NavItem[] {
  // Profile is only reachable via SidebarAccountFooter for every audience.
  return items.filter(item => item.href !== "/profile" && item.key !== "own-profile");
}

export function applyParentNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (!isParentPortalUser(permissions)) {
    return [...items];
  }

  const hiddenKeys = new Set([
    "home",
    "teacher-class-details",
    "classes",
    "billing-admin",
    "suggestions-submit",
    "schedule",
    "whatsapp-settings",
    "whatsapp-conversations",
    "whatsapp-groups",
  ]);
  return items.filter(item => !hiddenKeys.has(item.key));
}

export function applyTeacherNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (!isTeacherPortalUser(permissions)) {
    return [...items];
  }

  const hiddenKeys = new Set([
    "home",
    "books-and-bags",
    "whatsapp-settings",
    "whatsapp-conversations",
    "whatsapp-groups",
  ]);
  // Hide the admin grouped "classes" item only when the teacher-portal
  // "teacher-class-details" entry is also available (same /classes route).
  if (items.some(item => item.key === "teacher-class-details")) {
    hiddenKeys.add("classes");
  }
  return items.filter(item => !hiddenKeys.has(item.key));
}

export function applyStudentNavOverrides(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  if (!isStudentPortalUser(permissions)) {
    return [...items];
  }
  // Student portal: hide admin-focused items
  const hiddenKeys = new Set([
    "home",
    "search-schedule",
    "schedule-tracking",
    "own-profile",
    "whatsapp-settings",
    "whatsapp-conversations",
    "whatsapp-groups",
  ]);
  return items.filter(item => !hiddenKeys.has(item.key));
}

export function applySupervisorNavOverrides(
  items: readonly NavItem[],
  permissions: readonly AppPermission[]
): NavItem[] {
  if (!isSupervisorPortalUser(permissions)) {
    return [...items];
  }
  // Supervisor portal: hide admin chrome unlocked by triage permissions
  // (students list, schedule alerts, complaints, etc.).
  const hiddenKeys = new Set([
    "home",
    "own-profile",
    "search-schedule",
    "schedule-tracking",
    "schedule",
    "managers",
    "resources",
    "subjects",
    "books-and-bags",
    "reports",
    "billing-admin",
    "payment-catalogs",
    "feedback-manage",
    "dst-migration",
    "cron",
    "permissions",
    "settings",
    "whatsapp-settings",
    "whatsapp-conversations",
    "whatsapp-groups",
  ]);
  return items.filter(item => !hiddenKeys.has(item.key));
}
