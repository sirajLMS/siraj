import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { makeNavItem } from "@/frontend/common/views/dashboard/config/navigationItems.factory";

import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Directory / schedule / content sidebar entries grouped under
 * `grp_schedule`, `grp_users` and `grp_content`.
 */
export const SIDEBAR_DIRECTORY_NAV_ITEMS: readonly NavItem[] = [
  makeNavItem("search-schedule", "scheduleSearch", "search", "/search-schedule", PAGE_PERMISSIONS.searchSchedule, {
    groupId: "grp_schedule",
  }),
  makeNavItem(
    "schedule-tracking",
    "scheduleTrackingParent",
    "eventRepeat",
    "/schedule/tracking",
    PAGE_PERMISSIONS.scheduleTrackingParent,
    { groupId: "grp_schedule" }
  ),
  makeNavItem(
    "recurring-schedules",
    "createClass",
    "eventRepeat",
    "/recurring-schedules",
    PAGE_PERMISSIONS.recurringSchedules,
    { groupId: "grp_schedule" }
  ),
  makeNavItem("users-directory", "usersDirectory", "group", "/users", PAGE_PERMISSIONS.usersDirectoryParent),
  makeNavItem("teachers", "teachers", "school", "/teachers", PAGE_PERMISSIONS.teachers, { groupId: "grp_users" }),
  makeNavItem("parents", "parents", "diversity1", "/parents", PAGE_PERMISSIONS.parents, { groupId: "grp_users" }),
  makeNavItem("students", "students", "personOutline", "/students", PAGE_PERMISSIONS.students, {
    groupId: "grp_users",
  }),
  makeNavItem("staff", "staff", "badge", "/staff", PAGE_PERMISSIONS.staff, { groupId: "grp_users" }),
  makeNavItem("subjects", "subjects", "category", "/subjects", PAGE_PERMISSIONS.subjects, { groupId: "grp_content" }),
  makeNavItem("classes", "classDetails", "class", "/classes", PAGE_PERMISSIONS.classesPage, { groupId: "grp_content" }),
  makeNavItem("resources", "resources", "folderOpen", "/resources", PAGE_PERMISSIONS.resources, {
    groupId: "grp_content",
  }),
  makeNavItem(
    "books-and-bags",
    "booksAndBags",
    "menuBook",
    "/resources/books-and-bags",
    PAGE_PERMISSIONS.booksAndBags,
    { groupId: "grp_content" }
  ),
];
