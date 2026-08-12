import { lazy } from "react";

export const LazyTeachersTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/teachers/TeachersTab").then(m => ({
    default: m.TeachersTab,
  }))
);

export const LazyParentsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/parents/ParentsTab").then(m => ({
    default: m.ParentsTab,
  }))
);

export const LazyStudentsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/students/StudentsTab").then(m => ({
    default: m.StudentsTab,
  }))
);

export const LazyStaffTab = lazy(() =>
  import("@/frontend/common/views/dashboard/users/directory/tabs/staff/StaffTab").then(m => ({ default: m.StaffTab }))
);
