"use client";

import { Tab, Tabs } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import { StudentHistoryContainer } from "@/frontend/common/views/dashboard/students/history/StudentHistoryContainer";
import { StudentCreditHoursTab } from "@/frontend/common/views/dashboard/students/profile/StudentCreditHoursTab";
import { StudentManagerProfileTab } from "@/frontend/common/views/dashboard/students/profile/StudentManagerProfileTab";
import type { StudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/StudentQuotaContainer";
import { StudentClassesView } from "@/frontend/common/views/dashboard/students/status/StudentClassesContainer";
import { StudentStatusView } from "@/frontend/common/views/dashboard/students/status/StudentStatusContainer";

export interface StudentProfileTabsSharedOptions {
  readonly tabsSx: SxProps<Theme>;
  readonly scrollable: boolean;
}

interface StudentProfileTabBarSharedProps {
  readonly visibleTabs: StudentProfilePageViewModel["visibleTabs"];
  readonly currentTab: StudentProfilePageViewModel["activeTab"];
  readonly onTabChange: StudentProfilePageViewModel["onTabChange"];
  readonly tabs: StudentProfilePageViewModel["labelsBySection"]["tabs"];
  readonly options: StudentProfileTabsSharedOptions;
}

export function StudentProfileTabBarShared({
  visibleTabs,
  currentTab,
  onTabChange,
  tabs,
  options,
}: Readonly<StudentProfileTabBarSharedProps>) {
  return (
    <Tabs
      value={currentTab}
      onChange={onTabChange}
      variant={options.scrollable ? "scrollable" : undefined}
      scrollButtons={options.scrollable ? "auto" : undefined}
      allowScrollButtonsMobile={options.scrollable}
      sx={options.tabsSx}
    >
      {visibleTabs.includes("profile") ? <Tab value="profile" label={tabs.profile} /> : null}
      {visibleTabs.includes("status") ? <Tab value="status" label={tabs.status} /> : null}
      {visibleTabs.includes("classes") ? <Tab value="classes" label={tabs.classes} /> : null}
      {visibleTabs.includes("quota") ? <Tab value="quota" label={tabs.quota} /> : null}
      {visibleTabs.includes("credit-hours") ? <Tab value="credit-hours" label={tabs.creditHours} /> : null}
      {visibleTabs.includes("history") ? <Tab value="history" label={tabs.history} /> : null}
    </Tabs>
  );
}

interface StudentProfileTabPanelsSharedProps {
  readonly studentId: string;
  readonly currentTab: StudentProfilePageViewModel["activeTab"];
  readonly PanelsWrapper: FC<Readonly<{ children: ReactNode }>>;
}

export function StudentProfileTabPanelsShared({
  studentId,
  currentTab,
  PanelsWrapper,
}: Readonly<StudentProfileTabPanelsSharedProps>) {
  return (
    <PanelsWrapper>
      {currentTab === "profile" ? <StudentManagerProfileTab /> : null}
      {currentTab === "status" ? <StudentStatusView studentId={studentId} /> : null}
      {currentTab === "classes" ? <StudentClassesView studentId={studentId} /> : null}
      {currentTab === "quota" ? <StudentQuotaView studentId={studentId} /> : null}
      {currentTab === "credit-hours" ? <StudentCreditHoursTab studentId={studentId} /> : null}
      {currentTab === "history" ? <StudentHistoryContainer studentId={studentId} /> : null}
    </PanelsWrapper>
  );
}
