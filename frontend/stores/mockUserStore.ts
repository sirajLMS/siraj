import { create } from "zustand";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserInfo } from "@/frontend/views/dashboard/types/dashboard";

interface UserState extends UserInfo {
  setUser: (user: UserInfo) => void;
  user: UserInfo | null;
  hasPermission: (permission: AppPermission) => boolean;
}

export const MOCK_ADMIN_USER: UserInfo = {
  name: "Academy Admin",
  role: "Academy Admin",
  avatarUrl: "",
  permissions: [
    AppPermission.AuthLogin,
    AppPermission.AuthViewOwnProfile,
    AppPermission.DashboardView,
    AppPermission.DashboardViewMetrics,
    AppPermission.DashboardFilterMetrics,
    AppPermission.DashboardMetricsViewAll,
    AppPermission.ScheduleViewList,
    AppPermission.ScheduleFilterAdvanced,
    AppPermission.ScheduleViewAll,
    AppPermission.ScheduleViewAssigned,
    AppPermission.ScheduleViewFamily,
    AppPermission.ScheduleSearchAvailability,
    AppPermission.ScheduleManageRecurring,
    AppPermission.ScheduleDstMigrate,
    AppPermission.ClassesViewDetails,
    AppPermission.ClassesActivate,
    AppPermission.ClassesForceActivate,
    AppPermission.ClassesStart,
    AppPermission.ClassesMarkAbsent,
    AppPermission.ClassesRequestLeave,
    AppPermission.ClassesAdminLeave,
    AppPermission.ClassesReschedule,
    AppPermission.ClassesRevert,
    AppPermission.TeachersList,
    AppPermission.TeachersCreate,
    AppPermission.TeachersEdit,
    AppPermission.TeachersManageSchedule,
    AppPermission.ParentsList,
    AppPermission.ParentsCreate,
    AppPermission.ParentsEdit,
    AppPermission.StudentsList,
    AppPermission.StudentsEdit,
    AppPermission.StudentsChangeTeacher,
    AppPermission.StudentsChangeStatus,
    AppPermission.StudentsOverrideQuota,
    AppPermission.InvoicesList,
    AppPermission.InvoicesDelete,
    AppPermission.InvoicesCreate,
    AppPermission.InvoicesMarkPaid,
    AppPermission.InvoicesEdit,
    AppPermission.ResourcesList,
    AppPermission.ResourcesDelete,
    AppPermission.ResourcesUpload,
    AppPermission.ReportsGenerate,
    AppPermission.ComplaintsList,
    AppPermission.ComplaintsDelete,
    AppPermission.ComplaintsRespond,
    AppPermission.StaffList,
    AppPermission.StaffCreate,
    AppPermission.StaffEdit,
    AppPermission.PermissionGroupsManage,
    AppPermission.PermissionGroupsAssign,
  ],
  notificationCount: 3,
};

export const MOCK_AUTHENTICATED_USER: UserInfo = {
  name: "Standard User",
  role: "User",
  avatarUrl: "",
  permissions: [AppPermission.AuthLogin, AppPermission.AuthViewOwnProfile],
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
    hasPermission: (permission: AppPermission) => {
      const permissions = get().user?.permissions || get().permissions || [];
      return permissions.includes(permission);
    },
  };
});
