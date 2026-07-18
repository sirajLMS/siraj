"use client";

import { EditOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  hasTeacherIdentityData,
  hasTeacherProfessionalData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates";
import { isTeacherAdminData } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function TeacherProfileDesktopView({
  teacherData,
  avatarUrl,
  displayCurrency,
  isAdminScope,
  mode,
  scope,
}: Readonly<TeacherProfileViewModel>) {
  const t = useAppTranslation().profileTranslations.teacher;

  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;

  const renderCompensationSection = () => {
    if (!hasTeacherProfessionalData(teacherData)) {
      return null;
    }

    return (
      <DesktopSectionPanel title={t.sections.compensation}>
        <Stack spacing={2}>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.fields.hourlyRate}
            </Typography>
            {teacherData.hourlyRate} {teacherData.rateCurrency}
          </Typography>
          {teacherData.totalClasses != null && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {t.stats.totalClasses}
              </Typography>
              {teacherData.totalClasses}
            </Typography>
          )}
          {isAdminScope && adminData && adminData.avgEngagementScore != null && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {t.stats.avgEngagement}
              </Typography>
              {adminData.avgEngagementScore}
            </Typography>
          )}
          {"qualifications" in teacherData && teacherData.qualifications && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {t.fields.qualifications}
              </Typography>
              {teacherData.qualifications}
            </Typography>
          )}
        </Stack>
      </DesktopSectionPanel>
    );
  };

  const renderAdminOnlySection = () => {
    if (!isAdminScope || !adminData || !hasTeacherIdentityData(adminData)) {
      return null;
    }

    return (
      <DesktopSectionPanel title={t.sections.adminOnly}>
        <Stack spacing={2}>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.fields.nationalId}
            </Typography>
            {adminData.nationalId}
          </Typography>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.fields.dateOfBirth}
            </Typography>
            {adminData.dateOfBirth}
          </Typography>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.fields.gender}
            </Typography>
            {adminData.gender}
          </Typography>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.fields.address}
            </Typography>
            {adminData.address}
          </Typography>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.fields.timezone}
            </Typography>
            {adminData.timezone}
          </Typography>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.fields.status}
            </Typography>
            {adminData.status}
          </Typography>
        </Stack>
      </DesktopSectionPanel>
    );
  };

  const renderStatsSection = () => {
    if (!hasTeacherProfessionalData(teacherData)) {
      return null;
    }

    return (
      <DesktopSectionPanel title={t.sections.stats}>
        <Stack spacing={2}>
          <Typography variant="bodyMd">
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {t.stats.totalClasses}
            </Typography>
            {teacherData.totalClasses}
          </Typography>
          {isAdminScope && adminData && adminData.avgEngagementScore != null && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {t.stats.avgEngagement}
              </Typography>
              {adminData.avgEngagementScore}
            </Typography>
          )}
        </Stack>
      </DesktopSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    const email = teacherData.email ?? "";
    const subtitle: string = email as string;
    const title = teacherData.name ?? "";
    return (
      <DesktopPageContainer>
        <DesktopPageHeader
          title={title}
          subtitle={subtitle}
          actions={[
            <Button
              key="edit"
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => {
                // Handle edit navigation
              }}
            >
              {t.actions.edit}
            </Button>,
          ]}
        />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DesktopSectionPanel title={t.sections.account}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Avatar src={avatarUrl ?? undefined} sx={{ width: 80, height: 80 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="headlineMd">{teacherData.name}</Typography>
                  <Typography variant="bodyMd" color="text.secondary">
                    {teacherData.email}
                  </Typography>
                  {teacherData.phone && (
                    <Typography variant="bodyMd" color="text.secondary">
                      {teacherData.phone}
                    </Typography>
                  )}
                  {displayCurrency && (
                    <Typography variant="labelMd" color="text.secondary">
                      {t.fields.displayCurrency}: {displayCurrency}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </DesktopSectionPanel>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <DesktopSectionPanel title={t.sections.contact}>
              <Stack spacing={1}>
                {teacherData.phone && (
                  <Typography variant="bodyMd">
                    <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                      {t.fields.phone}
                    </Typography>
                    {teacherData.phone}
                  </Typography>
                )}
                {teacherData.timezone && (
                  <Typography variant="bodyMd">
                    <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                      {t.fields.timezone}
                    </Typography>
                    {teacherData.timezone}
                  </Typography>
                )}
              </Stack>
            </DesktopSectionPanel>
          </Grid>

          {renderCompensationSection()}
          {renderAdminOnlySection()}
          {renderStatsSection()}
        </Grid>
      </DesktopPageContainer>
    );
  }

  // Edit mode
  if (scope === ProfileScope.Own) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={t.actions.edit} />
        <Stack spacing={3}>
          <Typography variant="bodyMd" sx={{ px: 2, py: 3 }}>
            {t.actions.save} - form not implemented in view layer
          </Typography>
        </Stack>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.actions.edit} />
      <Stack spacing={3}>
        <Typography variant="bodyMd" sx={{ px: 2, py: 3 }}>
          {t.actions.save} - form not implemented in view layer
        </Typography>
      </Stack>
    </DesktopPageContainer>
  );
}
