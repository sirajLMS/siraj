"use client";

import { EditOutlined } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import {
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function StaffProfileMobileView({
  scope,
  mode,
  targetUserId,
  activeTab,
  isAdminScope,
  loading,
  error,
  profile,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
  staffData,
  avatarUrl,
  displayCurrency,
  meetingTabHref,
  canView,
}: Readonly<StaffProfileViewModel>) {
  const t = useAppTranslation().profileTranslations.base;
  const st = useAppTranslation().profileTranslations.staff;

  // Handle non-profile tabs
  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "permissions" && isAdminScope) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={st.sections.permissions} />
        <PermissionsSection
          permissionGroups={profile?.staffPermissionGroups ?? []}
          permissionOverrides={profile?.staffPermissionOverrides ?? []}
        />
      </MobilePageContainer>
    );
  }

  if (activeTab !== "profile") {
    return null;
  }

  // Profile tab content
  if (loading && !profile) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={st.pageTitle} subtitle={st.pageSubtitle} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <div className="loading-spinner" />
        </Box>
      </MobilePageContainer>
    );
  }

  if (error && !profile) {
    return (
      <MobilePageContainer>
        <MobilePageHeader title={st.pageTitle} subtitle={st.pageSubtitle} />
        <Alert severity="error" sx={{ mx: 2, my: 2 }} onClose={() => {}}>
          {t.errors.failedToLoad}
          <Button color="inherit" size="small" onClick={() => {}}>
            {t.actions.retry}
          </Button>
        </Alert>
      </MobilePageContainer>
    );
  }

  if (!profile?.staffProfile) {
    const canViewIdentity = canView("core_identity");
    if (!canViewIdentity) {
      return <ProfileRestrictedSection />;
    }
    return (
      <MobilePageContainer>
        <MobilePageHeader title={st.pageTitle} subtitle={st.pageSubtitle} />
        <Alert severity="warning" sx={{ mx: 2, my: 2 }}>
          {t.errors.notFound}
        </Alert>
      </MobilePageContainer>
    );
  }

  const adminData = staffData;

  const renderAccountSection = () => {
    if (!canView("core_identity") && !(isAdminScope && canView("staff_role"))) {
      return null;
    }
    return (
      <MobileSectionPanel title={st.sections.account}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar src={avatarUrl} sx={{ width: 60, height: 60 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="headlineMd">{staffData?.name ?? ""}</Typography>
            <Typography variant="bodyMd" color="text.secondary">
              {staffData?.email ?? ""}
            </Typography>
            {staffData?.phone && (
              <Typography variant="bodyMd" color="text.secondary">
                {staffData.phone}
              </Typography>
            )}
            {displayCurrency && (
              <Typography variant="labelMd" color="text.secondary">
                {st.fields.displayCurrency}: {displayCurrency}
              </Typography>
            )}
          </Box>
        </Stack>
      </MobileSectionPanel>
    );
  };

  const renderCompensationSection = () => {
    if (!canView("staff_role")) {
      return null;
    }
    if (isAdminScope) {
      return (
        <MobileSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {adminData?.hourlyRate} {adminData?.rateCurrency}
            </Typography>
            {adminData?.totalClasses != null && (
              <Typography variant="bodyMd">
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {st.stats.totalClasses}
                </Typography>
                {adminData.totalClasses}
              </Typography>
            )}
            {isAdminScope && adminData?.avgEngagementScore != null && (
              <Typography variant="bodyMd">
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {st.stats.avgEngagement}
                </Typography>
                {adminData.avgEngagementScore}
              </Typography>
            )}
            {adminData?.qualifications && (
              <Typography variant="bodyMd">
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {st.fields.qualifications}
                </Typography>
                {adminData.qualifications}
              </Typography>
            )}
          </Stack>
        </MobileSectionPanel>
      );
    }
    if (staffData?.hourlyRate || staffData?.rateCurrency) {
      return (
        <MobileSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {staffData.hourlyRate} {staffData.rateCurrency}
            </Typography>
          </Stack>
        </MobileSectionPanel>
      );
    }
    return null;
  };

  const renderContactSection = () => {
    if (!canView("core_contact")) {
      return null;
    }
    return (
      <MobileSectionPanel title={st.sections.contact}>
        <Stack spacing={1}>
          {staffData?.phone && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.phone}
              </Typography>
              {staffData.phone}
            </Typography>
          )}
          {staffData?.timezone && (
            <Typography variant="bodyMd">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.timezone}
              </Typography>
              {staffData.timezone}
            </Typography>
          )}
        </Stack>
      </MobileSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <MobilePageContainer>
        <MobilePageHeader
          title={staffData?.name ?? ""}
          subtitle={staffData?.email ?? ""}
          avatar={avatarUrl}
          actions={[
            <Button
              key="edit"
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => {
                // Navigation to edit mode handled by container
              }}
            >
              {t.actions.edit}
            </Button>,
          ]}
        />
        <MobileContentStack>
          {isAdminScope ? (
            <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
              {st.adminBanner}
            </Typography>
          ) : null}

          {renderAccountSection()}
          {renderContactSection()}
          {renderCompensationSection()}
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
          <StaffProfileEditForm
            staffData={staffData!}
            displayCurrency={displayCurrency}
            isAdminScope={isAdminScope}
            isSaving={isSaving}
            onSubmit={onSubmitOwn as any}
          />
        </MobileContentStack>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.actions.edit} />
      <MobileContentStack>
        <StaffProfileEditForm
          staffData={staffData!}
          displayCurrency={displayCurrency}
          isAdminScope={isAdminScope}
          isSaving={isSaving}
          onSubmit={onSubmitAdmin as any}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
