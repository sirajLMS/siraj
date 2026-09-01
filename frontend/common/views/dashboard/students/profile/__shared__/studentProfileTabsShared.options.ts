import type { StudentProfileTabsSharedOptions } from "@/frontend/common/views/dashboard/students/profile/__shared__/studentProfileTabsShared";

export const DESKTOP_PROFILE_TABS_OPTIONS: StudentProfileTabsSharedOptions = {
  tabsSx: { mb: 3 },
  scrollable: false,
};

export const MOBILE_PROFILE_TABS_OPTIONS: StudentProfileTabsSharedOptions = {
  tabsSx: { mb: 1, minHeight: 40 },
  scrollable: true,
};
