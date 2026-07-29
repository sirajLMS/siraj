"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { usePeopleDirectoryTabsStore } from "@/frontend/common/stores/peopleDirectoryTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { PeopleDirectoryTabId } from "@/frontend/common/views/dashboard/people/tabs/types";

type PeopleDirectoryTabPanelsProps = { readonly activeTab: PeopleDirectoryTabId };
type TabPanelDefinition = {
  readonly id: PeopleDirectoryTabId;
  readonly permissions: (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
  readonly Component: ComponentType;
};

const LazyTeachersTab = lazy(() =>
  import("@/frontend/common/views/dashboard/people/tabs/teachers/TeachersTab").then(m => ({ default: m.TeachersTab }))
);
const LazyParentsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/people/tabs/parents/ParentsTab").then(m => ({ default: m.ParentsTab }))
);
const LazyStudentsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/people/tabs/students/StudentsTab").then(m => ({ default: m.StudentsTab }))
);
const LazyStaffTab = lazy(() =>
  import("@/frontend/common/views/dashboard/people/tabs/staff/StaffTab").then(m => ({ default: m.StaffTab }))
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "teachers", permissions: PAGE_PERMISSIONS.peopleTeachers, Component: LazyTeachersTab },
  { id: "parents", permissions: PAGE_PERMISSIONS.peopleParents, Component: LazyParentsTab },
  { id: "students", permissions: PAGE_PERMISSIONS.peopleStudents, Component: LazyStudentsTab },
  { id: "staff", permissions: PAGE_PERMISSIONS.peopleStaff, Component: LazyStaffTab },
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

export function PeopleDirectoryTabPanels({ activeTab }: Readonly<PeopleDirectoryTabPanelsProps>) {
  const visitedTabs = usePeopleDirectoryTabsStore(state => state.visitedTabs);
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {TAB_PANELS.map(({ id, permissions, Component }) => {
        if (!visitedTabs[id]) return null;
        const isActive = activeTab === id;
        return (
          <Box
            key={id}
            role="tabpanel"
            id={`people-directory-tabpanel-${id}`}
            aria-labelledby={`people-directory-tab-${id}`}
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
