"use client";

import {
  ArrowBackOutlined,
  AssignmentOutlined,
  CalendarTodayOutlined,
  PersonOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import {
  MobileContentStack,
  MobileMetricCard,
  MobilePageContainer,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

export function StudentProfileMobileView({
  profile,
  labels,
  loading,
  onBackToDashboard,
}: Readonly<StudentProfileViewModel>) {
  if (loading || !profile) {
    return (
      <MobilePageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobileSectionPanel title={labels.personalInfo}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="headlineMd" sx={{ color: "onPrimary" }}>
                  {profile.name.charAt(0).toUpperCase()}
                </Typography>
              </Box>
              <Stack>
                <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                  {profile.name}
                </Typography>
                <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
                  {profile.status}
                </Typography>
              </Stack>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                {labels.email}
              </Typography>
              <Typography variant="bodyMd">{profile.email ?? "—"}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                {labels.phone}
              </Typography>
              <Typography variant="bodyMd">{profile.phone ?? "—"}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                {labels.dateOfBirth}
              </Typography>
              <Typography variant="bodyMd">{profile.dateOfBirth ?? "—"}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                {labels.gender}
              </Typography>
              <Typography variant="bodyMd">{profile.gender ?? "—"}</Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                {labels.language}
              </Typography>
              <Typography variant="bodyMd">{profile.language ?? "—"}</Typography>
            </Stack>
          </Stack>
        </MobileSectionPanel>

        {profile.parentName && (
          <MobileSectionPanel title={labels.parentInfo}>
            <Stack spacing={2}>
              <Stack spacing={1}>
                <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                  {labels.parentName}
                </Typography>
                <Typography variant="bodyMd">{profile.parentName}</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                  {labels.parentEmail}
                </Typography>
                <Typography variant="bodyMd">{profile.parentEmail ?? "—"}</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                  {labels.parentPhone}
                </Typography>
                <Typography variant="bodyMd">{profile.parentPhone ?? "—"}</Typography>
              </Stack>
            </Stack>
          </MobileSectionPanel>
        )}

        <MobileSectionPanel title={labels.academicInfo}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 140px" }}>
              <MobileMetricCard
                icon={SchoolOutlined}
                label={labels.teacher}
                value={profile.teacherName ?? "—"}
                variant="compact"
              />
            </Box>
            <Box sx={{ flex: "1 1 140px" }}>
              <MobileMetricCard
                icon={CalendarTodayOutlined}
                label={labels.hoursPerWeek}
                value={profile.hoursPerWeek ?? 0}
                variant="compact"
              />
            </Box>
            <Box sx={{ flex: "1 1 140px" }}>
              <MobileMetricCard
                icon={PersonOutlined}
                label={labels.classesRemaining}
                value={profile.classesRemaining ?? 0}
                variant="compact"
              />
            </Box>
            <Box sx={{ flex: "1 1 140px" }}>
              <MobileMetricCard
                icon={AssignmentOutlined}
                label={labels.classesTotal}
                value={profile.classesTotal ?? 0}
                variant="compact"
              />
            </Box>
          </Stack>
        </MobileSectionPanel>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onBackToDashboard}
        >
          {labels.cancel}
        </Button>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
