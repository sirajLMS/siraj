"use client";

import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import {
  StudentProfileTabBarShared,
  StudentProfileTabPanelsShared,
} from "@/frontend/common/views/dashboard/students/profile/__shared__/studentProfileTabsShared";
import { MOBILE_PROFILE_TABS_OPTIONS } from "@/frontend/common/views/dashboard/students/profile/__shared__/studentProfileTabsShared.options";
import type { StudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";
import {
  MobileContentInset,
  MobileLoadingState,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

export function StudentProfilePageMobileView({
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
      <MobilePageContainer>
        <MobileLoadingState />
      </MobilePageContainer>
    );
  }

  if (loadingState === "notFound") {
    return (
      <MobilePageContainer>
        <ProfileRestrictedSection title={shell.notFoundTitle} description={shell.notFoundDescription} />
      </MobilePageContainer>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={header.title} subtitle={header.subtitle} edgeToEdge={false} />
        <MobileContentInset>
          <ProfileRestrictedSection title={shell.title} />
        </MobileContentInset>
      </MobilePageContainer>
    );
  }

  const currentTab = activeTab ?? visibleTabs[0];

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={header.title}
        subtitle={header.subtitle}
        actions={
          statusBadge ? (
            <StatusBadge category={statusBadge.category} status={statusBadge.status} label={statusBadge.label} />
          ) : undefined
        }
        edgeToEdge={false}
      />

      <MobileContentInset sx={{ pb: 3 }}>
        <Stack sx={{ gap: 2 }}>
          <StudentProfileTabBarShared
            visibleTabs={visibleTabs}
            currentTab={currentTab}
            onTabChange={onTabChange}
            tabs={tabs}
            options={MOBILE_PROFILE_TABS_OPTIONS}
          />

          <StudentProfileTabPanelsShared
            studentId={studentId}
            currentTab={currentTab}
            PanelsWrapper={MobilePanelsWrapper}
          />
        </Stack>
      </MobileContentInset>
    </MobilePageContainer>
  );
}

function MobilePanelsWrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <Stack sx={{ gap: 2 }}>{children}</Stack>;
}
