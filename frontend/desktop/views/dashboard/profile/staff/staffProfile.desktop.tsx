"use client";

import { EditOutlined } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function StaffProfileDesktopView({
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
      <DesktopPageContainer>
        <DesktopPageHeader title={st.sections.permissions} />
        <PermissionsSection
          permissionGroups={profile?.staffPermissionGroups ?? []}
          permissionOverrides={profile?.staffPermissionOverrides ?? []}
        />
      </DesktopPageContainer>
    );
  }

  if (activeTab !== "profile") {
    return null;
  }

  // Profile tab content
  if (loading && !profile) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={st.pageTitle} subtitle={st.pageSubtitle} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <div className="loading-spinner" />
        </Box>
      </DesktopPageContainer>
    );
  }

  if (error && !profile) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={st.pageTitle} subtitle={st.pageSubtitle} />
        <Alert severity="error" sx={{ mx: 3, my: 2 }} onClose={() => {}}>
          {t.errors.failedToLoad}
          <Button color="inherit" size="small" onClick={() => {}}>
            {t.actions.retry}
          </Button>
        </Alert>
      </DesktopPageContainer>
    );
  }

  if (!profile?.staffProfile) {
    const canViewIdentity = canView("core_identity");
    if (!canViewIdentity) {
      return <ProfileRestrictedSection />;
    }
    return (
      <DesktopPageContainer>
        <DesktopPageHeader title={st.pageTitle} subtitle={st.pageSubtitle} />
        <Alert severity="warning" sx={{ mx: 3, my: 2 }}>
          {t.errors.notFound}
        </Alert>
      </DesktopPageContainer>
    );
  }

  const adminData = staffData;

  const renderAccountSection = () => {
    if (!canView("core_identity") && !(isAdminScope && canView("staff_role"))) {
      return null;
    }
    return (
      <DesktopSectionPanel title={st.sections.account}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar src={avatarUrl} sx={{ width: 80, height: 80 }} />
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
      </DesktopSectionPanel>
    );
  };

  const renderCompensationSection = () => {
    if (!canView("staff_role")) {
      return null;
    }
    if (isAdminScope) {
      return (
        <DesktopSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {adminData?.hourlyRate} {adminData?.rateCurrency}
            </Typography>
            {adminData?.totalClasses != null && (
              <Typography variant="bodyLg">
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {st.stats.totalClasses}
                </Typography>
                {adminData.totalClasses}
              </Typography>
            )}
            {isAdminScope && adminData?.avgEngagementScore != null && (
              <Typography variant="bodyLg">
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {st.stats.avgEngagement}
                </Typography>
                {adminData.avgEngagementScore}
              </Typography>
            )}
            {adminData?.qualifications && (
              <Typography variant="bodyLg">
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {st.fields.qualifications}
                </Typography>
                {adminData.qualifications}
              </Typography>
            )}
          </Stack>
        </DesktopSectionPanel>
      );
    }
    if (staffData?.hourlyRate || staffData?.rateCurrency) {
      return (
        <DesktopSectionPanel title={st.sections.compensation}>
          <Stack spacing={2}>
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.hourlyRate}
              </Typography>
              {staffData.hourlyRate} {staffData.rateCurrency}
            </Typography>
          </Stack>
        </DesktopSectionPanel>
      );
    }
    return null;
  };

  const renderContactSection = () => {
    if (!canView("core_contact")) {
      return null;
    }
    return (
      <DesktopSectionPanel title={st.sections.contact}>
        <Stack spacing={1}>
          {staffData?.phone && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.phone}
              </Typography>
              {staffData.phone}
            </Typography>
          )}
          {staffData?.timezone && (
            <Typography variant="bodyLg">
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {st.fields.timezone}
              </Typography>
              {staffData.timezone}
            </Typography>
          )}
        </Stack>
      </DesktopSectionPanel>
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <DesktopPageContainer>
        <DesktopPageHeader
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
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            {isAdminScope ? (
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
                {st.adminBanner}
              </Typography>
            ) : null}

            {renderAccountSection()}
            {renderContactSection()}
            {renderCompensationSection()}
          </Grid>
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
          <StaffProfileEditForm
            staffData={staffData!}
            displayCurrency={displayCurrency}
            isAdminScope={isAdminScope}
            isSaving={isSaving}
            onSubmit={onSubmitOwn as any}
          />
        </Stack>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.actions.edit} />
      <Stack spacing={3}>
        <StaffProfileEditForm
          staffData={staffData!}
          displayCurrency={displayCurrency}
          isAdminScope={isAdminScope}
          isSaving={isSaving}
          onSubmit={onSubmitAdmin as any}
        />
      </Stack>
    </DesktopPageContainer>
  );
}
