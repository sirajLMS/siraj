"use client";

import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentHistoryContainer } from "@/frontend/common/views/dashboard/students/history/StudentHistoryContainer";
import type { StudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/StudentQuotaContainer";
import { StudentStatusView } from "@/frontend/common/views/dashboard/students/status/StudentStatusContainer";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function StudentProfilePageDesktopView({
  studentId,
  loadingState,
  header,
  statusBadge,
  visibleTabs,
  activeTab,
  fallbackTitle,
  loadingLabel,
  notFoundTitle,
  notFoundDescription,
  tabLabels,
  onTabChange,
}: Readonly<StudentProfilePageViewModel>) {
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
            {loadingLabel}
          </Typography>
        </Box>
      </DesktopPageContainer>
    );
  }

  if (loadingState === "notFound") {
    return (
      <DesktopPageContainer>
        <ProfileRestrictedSection title={notFoundTitle} description={notFoundDescription} />
      </DesktopPageContainer>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={header.title} subtitle={header.subtitle} />
        <ProfileRestrictedSection title={fallbackTitle} />
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
        {visibleTabs.includes("status") ? <Tab value="status" label={tabLabels.status} /> : null}
        {visibleTabs.includes("quota") ? <Tab value="quota" label={tabLabels.quota} /> : null}
        {visibleTabs.includes("history") ? <Tab value="history" label={tabLabels.history} /> : null}
      </Tabs>

      <Box>
        {currentTab === "status" ? <StudentStatusView studentId={studentId} /> : null}
        {currentTab === "quota" ? <StudentQuotaView studentId={studentId} /> : null}
        {currentTab === "history" ? <StudentHistoryContainer studentId={studentId} /> : null}
      </Box>
    </DesktopPageContainer>
  );
}
