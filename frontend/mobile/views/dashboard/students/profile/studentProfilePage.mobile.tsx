"use client";

import { Box, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentHistoryContainer } from "@/frontend/common/views/dashboard/students/history/StudentHistoryContainer";
import type { StudentProfilePageViewModel } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/StudentQuotaContainer";
import { StudentClassesView } from "@/frontend/common/views/dashboard/students/status/StudentClassesContainer";
import { StudentStatusView } from "@/frontend/common/views/dashboard/students/status/StudentStatusContainer";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

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
        <Stack
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 6,
            px: 2,
          }}
        >
          <CircularProgress size={28} />
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {shell.loading}
          </Typography>
        </Stack>
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
        <Box sx={{ px: 2 }}>
          <ProfileRestrictedSection title={shell.title} />
        </Box>
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

      <Stack sx={{ gap: 2, px: 2, pb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 1, minHeight: 40 }}
        >
          {visibleTabs.includes("status") ? <Tab value="status" label={tabs.status} /> : null}
          {visibleTabs.includes("classes") ? <Tab value="classes" label={tabs.classes} /> : null}
          {visibleTabs.includes("quota") ? <Tab value="quota" label={tabs.quota} /> : null}
          {visibleTabs.includes("history") ? <Tab value="history" label={tabs.history} /> : null}
        </Tabs>

        <Stack sx={{ gap: 2 }}>
          {currentTab === "status" ? <StudentStatusView studentId={studentId} /> : null}
          {currentTab === "classes" ? <StudentClassesView studentId={studentId} /> : null}
          {currentTab === "quota" ? <StudentQuotaView studentId={studentId} /> : null}
          {currentTab === "history" ? <StudentHistoryContainer studentId={studentId} /> : null}
        </Stack>
      </Stack>
    </MobilePageContainer>
  );
}
