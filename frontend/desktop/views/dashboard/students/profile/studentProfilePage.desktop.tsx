"use client";

import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentHistoryContainer } from "@/frontend/common/views/dashboard/students/history/StudentHistoryContainer";
import { StudentCreditHoursTab } from "@/frontend/common/views/dashboard/students/profile/StudentCreditHoursTab";
import { StudentManagerProfileTab } from "@/frontend/common/views/dashboard/students/profile/StudentManagerProfileTab";
import type { StudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/StudentQuotaContainer";
import { StudentClassesView } from "@/frontend/common/views/dashboard/students/status/StudentClassesContainer";
import { StudentStatusView } from "@/frontend/common/views/dashboard/students/status/StudentStatusContainer";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 10,
          }}
        >
          <CircularProgress />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {shell.loading}
          </Typography>
        </Box>
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

      <Tabs value={currentTab} onChange={onTabChange} sx={{ mb: 3 }}>
        {visibleTabs.includes("profile") ? <Tab value="profile" label={tabs.profile} /> : null}
        {visibleTabs.includes("status") ? <Tab value="status" label={tabs.status} /> : null}
        {visibleTabs.includes("classes") ? <Tab value="classes" label={tabs.classes} /> : null}
        {visibleTabs.includes("quota") ? <Tab value="quota" label={tabs.quota} /> : null}
        {visibleTabs.includes("credit-hours") ? <Tab value="credit-hours" label={tabs.creditHours} /> : null}
        {visibleTabs.includes("history") ? <Tab value="history" label={tabs.history} /> : null}
      </Tabs>

      <Box>
        {currentTab === "profile" ? <StudentManagerProfileTab /> : null}
        {currentTab === "status" ? <StudentStatusView studentId={studentId} /> : null}
        {currentTab === "classes" ? <StudentClassesView studentId={studentId} /> : null}
        {currentTab === "quota" ? <StudentQuotaView studentId={studentId} /> : null}
        {currentTab === "credit-hours" ? <StudentCreditHoursTab studentId={studentId} /> : null}
        {currentTab === "history" ? <StudentHistoryContainer studentId={studentId} /> : null}
      </Box>
    </DesktopPageContainer>
  );
}
