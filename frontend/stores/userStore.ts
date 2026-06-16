import { create } from "zustand";
import type { UserInfo } from "@/frontend/views/dashboard/types/dashboard";

interface UserState extends UserInfo {
  setUser: (user: UserInfo) => void;
}

export const MOCK_ADMIN_USER: UserInfo = {
  name: "Ahmed",
  role: "SUPER ADMIN",
  avatarUrl: "",
  permissions: [
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

export const MOCK_TEACHER_DASHBOARD_USER: UserInfo = {
  name: "Prof. Ahmed Al-Siraj",
  role: "TEACHER",
  avatarUrl: "",
  permissions: ["teacher-dashboard", "schedule-search", "resources-view"],
  notificationCount: 2,
};

export const MOCK_TEACHER_ACTIVE_USER: UserInfo = {
  name: "Prof. Ahmed Al-Siraj",
  role: "TEACHER",
  avatarUrl: "",
  permissions: ["teacher-dashboard", "teacher-dashboard-controls", "schedule-search", "resources-view"],
  notificationCount: 2,
};

export const MOCK_PARENT_BILLING_USER: UserInfo = {
  name: "Ahmed Al-Siraj",
  role: "PARENT",
  avatarUrl: "",
  permissions: ["parent-dashboard", "schedule-search", "students-view", "billing-view"],
  notificationCount: 1,
};

export const MOCK_PARENT_SUGGESTIONS_USER: UserInfo = {
  name: "Fatima Al-Siraj",
  role: "PARENT",
  avatarUrl: "",
  permissions: ["parent-dashboard", "schedule-search", "students-view", "suggestions-submit"],
  notificationCount: 1,
};

export const MOCK_PARENT_COMPLAINTS_USER: UserInfo = {
  name: "Fatima Al-Siraj",
  role: "PARENT",
  avatarUrl: "",
  permissions: ["parent-dashboard", "schedule-search", "students-view", "complaints-submit"],
  notificationCount: 1,
};

export const useUserStore = create<UserState>(set => ({
  ...MOCK_ADMIN_USER,
  setUser: (user: UserInfo) => {
    set(user);
  },
}));
