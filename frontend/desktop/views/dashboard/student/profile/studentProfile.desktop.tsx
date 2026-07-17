"use client";

import {
  ArrowBackOutlined,
  AssignmentOutlined,
  CalendarTodayOutlined,
  EmailOutlined,
  LanguageOutlined,
  PersonOutlined,
  PhoneOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { Box, Button, Divider, Grid, Stack, Typography } from "@mui/material";
import type { StudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page";

export function StudentProfileDesktopView({
  profile,
  labels,
  loading,
  onBackToDashboard,
}: Readonly<StudentProfileViewModel>) {
  if (loading || !profile) {
    return (
      <DesktopPageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <Box sx={{ mb: 3 }}>
        <Typography variant="headlineLg" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
          {labels.pageTitle}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DesktopSectionPanel title={labels.personalInfo} sx={{ height: "100%" }}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    backgroundColor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="headlineLg" sx={{ color: "onPrimary" }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Typography>
                </Box>
                <Stack>
                  <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
                    {profile.name}
                  </Typography>
                  <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
                    {profile.status}
                  </Typography>
                </Stack>
              </Stack>
              <Divider />
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <EmailOutlined sx={{ color: "text.secondary" }} fontSize="small" />
                  <Stack>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {labels.email}
                    </Typography>
                    <Typography variant="bodyMd">{profile.email ?? "—"}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <PhoneOutlined sx={{ color: "text.secondary" }} fontSize="small" />
                  <Stack>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {labels.phone}
                    </Typography>
                    <Typography variant="bodyMd">{profile.phone ?? "—"}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <CalendarTodayOutlined sx={{ color: "text.secondary" }} fontSize="small" />
                  <Stack>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {labels.dateOfBirth}
                    </Typography>
                    <Typography variant="bodyMd">{profile.dateOfBirth ?? "—"}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <LanguageOutlined sx={{ color: "text.secondary" }} fontSize="small" />
                  <Stack>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {labels.language}
                    </Typography>
                    <Typography variant="bodyMd">{profile.language ?? "—"}</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </DesktopSectionPanel>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          {profile.parentName && (
            <DesktopSectionPanel title={labels.parentInfo} sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {labels.parentName}
                    </Typography>
                    <Typography variant="bodyMd">{profile.parentName}</Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {labels.parentEmail}
                    </Typography>
                    <Typography variant="bodyMd">{profile.parentEmail ?? "—"}</Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                      {labels.parentPhone}
                    </Typography>
                    <Typography variant="bodyMd">{profile.parentPhone ?? "—"}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </DesktopSectionPanel>
          )}

          <DesktopSectionPanel title={labels.academicInfo} sx={{ mb: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={SchoolOutlined}
                  label={labels.teacher}
                  value={profile.teacherName ?? "—"}
                  variant="compact"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={CalendarTodayOutlined}
                  label={labels.hoursPerWeek}
                  value={profile.hoursPerWeek ?? 0}
                  variant="compact"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={PersonOutlined}
                  label={labels.classesRemaining}
                  value={profile.classesRemaining ?? 0}
                  variant="compact"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <DesktopMetricCard
                  icon={AssignmentOutlined}
                  label={labels.classesTotal}
                  value={profile.classesTotal ?? 0}
                  variant="compact"
                />
              </Grid>
            </Grid>
          </DesktopSectionPanel>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onBackToDashboard}
        >
          {labels.cancel}
        </Button>
      </Box>
    </DesktopPageContainer>
  );
}
