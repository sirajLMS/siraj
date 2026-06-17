import { create } from "zustand";
import type { UserInfo } from "@/frontend/views/dashboard/types/dashboard";

interface UserState extends UserInfo {
  setUser: (user: UserInfo) => void;
  user: UserInfo | null;
  hasPermission: (permission: string) => boolean;
}

export const MOCK_ADMIN_USER: UserInfo = {
  name: "Academy Admin",
  role: "Academy Admin",
  avatarUrl: "",
  permissions: [
    "auth.login",
    "auth.view_own_profile",
    "dashboard.view_metrics",
    "dashboard.filter_metrics",
    "schedule.view_list",
    "schedule.filter_advanced",
    "home",
    "schedule-search",
    "schedule-tracking",
    "status-tracking",
    "schedule-alerts",
    "teachers-view",
    "teachers-schedule",
    "teacher-availability",
    "teacher-future-schedule",
    "teachers-reassignment",
    "parents-view",
    "parents-profile",
    "parents-onboard",
    "parent-dashboard",
    "students-view",
    "students-history",
    "students-quota",
    "students-status",
    "managers-view",
    "managers-onboard",
    "resources-view",
    "resources-manage",
    "reports-view",
    "reports-generate",
    "billing-manage",
    "billing-view",
    "billing-create",
    "suggestions-manage",
    "suggestions-submit",
    "complaints-view",
    "complaints-manage",
    "complaints-submit",
    "schedule-reschedule",
    "system-admin",
    "add-account",
    "classes-view",
    "classes-manage",
    "classes-audit",
    "classes-create",
    "teachers-onboard",
    "teacher-dashboard",
    "teacher-dashboard-controls",
  ],
  notificationCount: 3,
};

export const MOCK_AUTHENTICATED_USER: UserInfo = {
  name: "Standard User",
  role: "User",
  avatarUrl: "",
  permissions: ["auth.login", "auth.view_own_profile"],
  notificationCount: 0,
};

export const useUserStore = create<UserState>((set, get) => {
  const defaultUser = MOCK_ADMIN_USER;
  return {
    ...defaultUser,
    user: defaultUser,
    setUser: (user: UserInfo) => {
      set({
        ...user,
        user,
      });
    },
    hasPermission: (permission: string) => {
      const permissions = get().user?.permissions || get().permissions || [];
      return permissions.includes(permission);
    },
  };
});
