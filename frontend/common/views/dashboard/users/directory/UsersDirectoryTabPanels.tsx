"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { useUsersDirectoryTabsStore } from "@/frontend/common/stores/usersDirectoryTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { UsersDirectoryTabId } from "@/frontend/common/views/dashboard/users/directory/tabs/types";

type UsersDirectoryTabPanelsProps = { readonly activeTab: UsersDirectoryTabId };
type TabPanelDefinition = {
  readonly id: UsersDirectoryTabId;
  readonly permissions: (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
  readonly Component: ComponentType;
};

const LazyTeachersTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/teachers/TeachersTab").then(m => ({
    default: m.TeachersTab,
  }))
);
const LazyParentsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/parents/ParentsTab").then(m => ({
    default: m.ParentsTab,
  }))
);
const LazyStudentsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/students/StudentsTab").then(m => ({
    default: m.StudentsTab,
  }))
);
const LazyStaffTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/staff/StaffTab").then(m => ({ default: m.StaffTab }))
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "teachers", permissions: PAGE_PERMISSIONS.usersTeachers, Component: LazyTeachersTab },
  { id: "parents", permissions: PAGE_PERMISSIONS.usersParents, Component: LazyParentsTab },
  { id: "students", permissions: PAGE_PERMISSIONS.usersStudents, Component: LazyStudentsTab },
  { id: "staff", permissions: PAGE_PERMISSIONS.usersStaff, Component: LazyStaffTab },
];

function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function getTabPanelSx(isActive: boolean) {
  return isActive
    ? {
        position: "relative" as const,
        width: "100%",
        visibility: "visible" as const,
        overflow: "visible" as const,
        pointerEvents: "auto" as const,
      }
    : {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        visibility: "hidden" as const,
        height: 0,
        overflow: "hidden" as const,
        pointerEvents: "none" as const,
      };
}

export function UsersDirectoryTabPanels({ activeTab }: Readonly<UsersDirectoryTabPanelsProps>) {
  const visitedTabs = useUsersDirectoryTabsStore(state => state.visitedTabs);
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {TAB_PANELS.map(({ id, permissions, Component }) => {
        if (!visitedTabs[id]) return null;
        const isActive = activeTab === id;
        return (
          <Box
            key={id}
            role="tabpanel"
            id={`users-directory-tabpanel-${id}`}
            aria-labelledby={`users-directory-tab-${id}`}
            aria-hidden={!isActive}
            sx={getTabPanelSx(isActive)}
          >
            <RequirePermission permissions={permissions} fallback={null}>
              <Suspense fallback={<TabPanelFallback />}>
                <Component />
              </Suspense>
            </RequirePermission>
          </Box>
        );
      })}
    </Box>
  );
}
