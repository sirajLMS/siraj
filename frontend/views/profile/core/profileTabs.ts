"use client";

// ProfileAudience enum is used in the audiences array below

// Tab visibility matrix:
// - "own" scope: tabs visible to the user viewing their own profile
// - "other" scope: tabs visible when viewing another user's profile
// - Audiences: teacher, parent, staff

export const profileTabs = [
  {
    id: "profile",
    i18nKey: "profile.shell.tabs.profile",
    scope: "own", // Visible only to the user viewing their own profile
    audiences: ["teacher", "parent", "staff"], // Visible to all audiences
    view: "ProfileTab", // React component for the tab
    forbiddenPermissions: [], // No restrictions
  },
  {
    id: "banking",
    i18nKey: "profile.shell.tabs.banking",
    scope: "other", // Visible only when viewing another user's profile
    audiences: ["teacher"], // Visible only to staff viewing teacher profiles
    view: "BankingTab",
    forbiddenPermissions: [],
  },
  {
    id: "students",
    i18nKey: "profile.shell.tabs.students",
    scope: "other", // Visible only when viewing another user's profile
    audiences: ["teacher"], // Visible only to staff viewing teacher profiles
    view: "StudentsTab",
    forbiddenPermissions: [],
  },
  {
    id: "notifications",
    i18nKey: "profile.shell.tabs.notifications",
    scope: "own", // Visible to the user viewing their own profile
    audiences: ["teacher", "parent"], // Visible to teachers and parents
    view: "NotificationsTab",
    forbiddenPermissions: [],
  },
  {
    id: "permissions",
    i18nKey: "profile.shell.tabs.permissions",
    scope: "other", // Visible only when viewing another user's profile
    audiences: ["staff"], // Visible only to staff with admin permissions
    view: "PermissionsTab",
    forbiddenPermissions: ["auth.view_own_profile"], // Requires elevated permissions
  },
];
