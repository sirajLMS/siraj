"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import {
  StudentProfileTabBarShared,
  StudentProfileTabPanelsShared,
} from "@/frontend/common/views/dashboard/students/profile/__shared__/studentProfileTabsShared";
import { DESKTOP_PROFILE_TABS_OPTIONS } from "@/frontend/common/views/dashboard/students/profile/__shared__/studentProfileTabsShared.options";
import type { StudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopLoadingState } from "@/frontend/desktop/components/ui/state";

export function StudentProfilePageDesktopView({
  studentId,
  loadingState,
  header,
  statusBadge,
  visibleTabs,
  activeTab,
  labelsBySection,
  onTabChange,
}: Readonly<StudentProfilePageViewModel>) {
  const { shell, tabs } = labelsBySection;

  if (loadingState === "loading") {
    return (
      <DesktopPageContainer>
        <DesktopLoadingState />
      </DesktopPageContainer>
    );
  }

  if (loadingState === "notFound") {
    return (
      <DesktopPageContainer>
        <ProfileRestrictedSection title={shell.notFoundTitle} description={shell.notFoundDescription} />
      </DesktopPageContainer>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={header.title} subtitle={header.subtitle} />
        <ProfileRestrictedSection title={shell.title} />
      </DesktopPageContainer>
    );
  }

  const currentTab = activeTab ?? visibleTabs[0];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={header.title}
        subtitle={header.subtitle}
        actions={
          statusBadge ? (
            <StatusBadge category={statusBadge.category} status={statusBadge.status} label={statusBadge.label} />
          ) : undefined
        }
      />

      <StudentProfileTabBarShared
        visibleTabs={visibleTabs}
        currentTab={currentTab}
        onTabChange={onTabChange}
        tabs={tabs}
        options={DESKTOP_PROFILE_TABS_OPTIONS}
      />

      <StudentProfileTabPanelsShared
        studentId={studentId}
        currentTab={currentTab}
        PanelsWrapper={DesktopPanelsWrapper}
      />
    </DesktopPageContainer>
  );
}

function DesktopPanelsWrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <Box>{children}</Box>;
}
