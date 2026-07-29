"use client";

import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/staff/sections/ContactSection";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import type { StaffProfileViewLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { toStaffSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";

type StaffProfileTranslations = StaffProfileViewLabels;

interface StaffProfileDesktopGuardProps {
  readonly activeTab: string;
  readonly scope: ProfileScope;
  readonly isAdminScope: boolean;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly staffData: StaffProfileViewModel["staffData"] | null | undefined;
  readonly permissionGroups: StaffProfileViewModel["permissionGroups"];
  readonly permissionOverrides: StaffProfileViewModel["permissionOverrides"];
  readonly canView: StaffProfileViewModel["canView"];
  readonly translations: StaffProfileTranslations;
}

function StaffProfileDesktopGuard(props: Readonly<StaffProfileDesktopGuardProps>) {
  const {
    activeTab,
    scope,
    isAdminScope,
    loading,
    error,
    staffData,
    permissionGroups,
    permissionOverrides,
    canView,
    translations,
  } = props;
  const t = translations.base;

  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "permissions" && isAdminScope) {
    return <PermissionsSection permissionGroups={permissionGroups} permissionOverrides={permissionOverrides} />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  if (loading && !staffData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <div className="loading-spinner" />
      </Box>
    );
  }

  if (error && !staffData) {
    return (
      <Alert severity="error" sx={{ my: 2 }} onClose={() => {}}>
        {t.errors.failedToLoad}
        <Button color="inherit" size="small" onClick={() => {}}>
          {t.actions.retry}
        </Button>
      </Alert>
    );
  }

  if (!staffData) {
    const canViewIdentity = canView("core_identity");
    if (!canViewIdentity) {
      return <ProfileRestrictedSection />;
    }
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        {t.errors.notFound}
      </Alert>
    );
  }

  return null;
}

export function StaffProfileDesktopView({
  labels,
  scope,
  mode,
  isAdminScope,
  loading,
  error,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
  staffData,
  avatarUrl,
  displayCurrency,
  targetUserId,
  permissionGroups,
  permissionOverrides,
  activeTab,
  canView,
}: Readonly<StaffProfileViewModel>) {
  const translations = labels;
  const st = labels.staff;

  // Call as a function (not JSX) so the success path can return null and continue to the form.
  const guard = StaffProfileDesktopGuard({
    activeTab,
    scope,
    isAdminScope,
    loading,
    error,
    staffData,
    permissionGroups,
    permissionOverrides,
    canView,
    translations,
  });
  if (guard !== null) {
    return guard;
  }

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
              {staffData?.hourlyRate} {staffData?.rateCurrency}
            </Typography>
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

  const sectionLabels = {
    staff: st,
    baseLabels: toStaffSharedBaseLabels(translations.base),
  };

  const renderContactSection = () => (
    <ContactSection mode="view" labels={sectionLabels} scope={scope} staffData={staffData} />
  );

  if (mode === ProfileMode.View) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            {isAdminScope ? (
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
                {st.adminBanner}
              </Typography>
            ) : null}
            {renderContactSection()}
            {renderCompensationSection()}
          </Stack>
        </Grid>
      </Grid>
    );
  }

  if (scope === ProfileScope.Own) {
    return (
      <StaffProfileEditForm
        staffData={staffData}
        avatarUrl={avatarUrl}
        displayCurrency={displayCurrency}
        targetUserId={targetUserId}
        isAdminScope={isAdminScope}
        isSaving={isSaving}
        onSubmit={values => onSubmitOwn(values)}
      />
    );
  }

  return (
    <StaffProfileEditForm
      staffData={staffData}
      avatarUrl={avatarUrl}
      displayCurrency={displayCurrency}
      targetUserId={targetUserId}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={values => onSubmitAdmin(values)}
    />
  );
}
