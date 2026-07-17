"use client";

import { EditOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  isTeacherAdminData,
  type TeacherAdminData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type {
  TeacherProfileViewModel,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import {
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

function hasTeacherProfessionalData(teacherData: TeacherViewData): boolean {
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  const qualifications = "qualifications" in teacherData ? teacherData.qualifications : null;
  return Boolean(
    qualifications?.trim() ||
      teacherData.hourlyRate?.trim() ||
      teacherData.rateCurrency ||
      teacherData.totalClasses != null ||
      adminData?.avgEngagementScore != null
  );
}

function hasTeacherIdentityData(adminData: TeacherAdminData): boolean {
  return Boolean(
    adminData.nationalId?.trim() ||
      adminData.dateOfBirth?.trim() ||
      adminData.gender ||
      adminData.address?.trim() ||
      adminData.timezone?.trim() ||
      adminData.status
  );
}

export function TeacherProfileMobileView({
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
      <MobileSectionPanel title={t.sections.compensation}>
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
      </MobileSectionPanel>
    );
  };

  const renderAdminOnlySection = () => {
    if (!isAdminScope || !adminData || !hasTeacherIdentityData(adminData)) {
      return null;
    }

    return (
      <MobileSectionPanel title={t.sections.adminOnly}>
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
      </MobileSectionPanel>
    );
  };

  const renderStatsSection = () => {
    if (!hasTeacherProfessionalData(teacherData)) {
      return null;
    }

    return (
      <MobileSectionPanel title={t.sections.stats}>
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
      </MobileSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    const email = teacherData.email ?? "";
    const subtitle: string = email as string;
    const title = teacherData.name ?? "";
    return (
      <MobilePageContainer>
        <MobilePageHeader
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
        <MobileContentStack>
          <MobileSectionPanel title={t.sections.account}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar src={avatarUrl ?? undefined} sx={{ width: 60, height: 60 }} />
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
          </MobileSectionPanel>

          <MobileSectionPanel title={t.sections.contact}>
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
          </MobileSectionPanel>

          {renderCompensationSection()}
          {renderAdminOnlySection()}
          {renderStatsSection()}
        </MobileContentStack>
      </MobilePageContainer>
    );
  }

  // Edit mode
  if (scope === ProfileScope.Own) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={t.actions.edit} />
        <MobileContentStack>
          <Typography variant="bodyMd" sx={{ px: 2, py: 3 }}>
            {t.actions.save} - form not implemented in view layer
          </Typography>
        </MobileContentStack>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.actions.edit} />
      <MobileContentStack>
        <Typography variant="bodyMd" sx={{ px: 2, py: 3 }}>
          {t.actions.save} - form not implemented in view layer
        </Typography>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
