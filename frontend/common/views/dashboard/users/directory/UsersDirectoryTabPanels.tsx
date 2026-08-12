"use client";

import { useUsersDirectoryTabsStore } from "@/frontend/common/stores/usersDirectoryTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { createTabbedPanePanels } from "@/frontend/common/views/dashboard/lib/createTabbedPanePanels";
import type { UsersDirectoryTabId } from "@/frontend/common/views/dashboard/users/directory/tabs/types";
import {
  LazyParentsTab,
  LazyStaffTab,
  LazyStudentsTab,
  LazyTeachersTab,
} from "@/frontend/common/views/dashboard/users/directory/UsersDirectoryTabPanels.lazy";

export const UsersDirectoryTabPanels = createTabbedPanePanels<UsersDirectoryTabId>({
  useVisitedTabs: () => useUsersDirectoryTabsStore(state => state.visitedTabs),
  ariaIdPrefix: "users-directory",
  panels: [
    { id: "teachers", permissions: PAGE_PERMISSIONS.usersTeachers, Component: LazyTeachersTab },
    { id: "parents", permissions: PAGE_PERMISSIONS.usersParents, Component: LazyParentsTab },
    { id: "students", permissions: PAGE_PERMISSIONS.usersStudents, Component: LazyStudentsTab },
    { id: "staff", permissions: PAGE_PERMISSIONS.usersStaff, Component: LazyStaffTab },
  ],
});
