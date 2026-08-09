"use client";

import { Alert, Box, Button, Typography } from "@mui/material";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { StaffExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/StaffExtensionProfileSection";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/staff/sections/AdminOnlySection";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import type { StaffProfileViewLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { toStaffSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { MobileContentStack } from "@/frontend/mobile/components/ui";

type StaffProfileTranslations = StaffProfileViewLabels;

interface StaffProfileMobileGuardProps {
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

function StaffProfileMobileGuard(props: Readonly<StaffProfileMobileGuardProps>) {
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

export function StaffProfileMobileView({
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
  profileTimezone,
  profilePhone,
  targetUserId,
  permissionGroups,
  permissionOverrides,
  activeTab,
  canView,
}: Readonly<StaffProfileViewModel>) {
  const translations = labels;
  const st = labels.staff;

  // Call as a function (not JSX) so the success path can return null and continue to the form.
  const guard = StaffProfileMobileGuard({
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

  const sectionLabels = {
    staff: st,
    baseLabels: toStaffSharedBaseLabels(translations.base),
  };

  const renderContactSection = () => (
    <UserDetailsProfileSection
      scope={scope}
      sectionTitle={st.sections.contact}
      phoneLabel={st.fields.phone}
      timezoneLabel={st.fields.timezone}
      currencyLabel={st.fields.displayCurrency}
      phone={profilePhone ?? staffData?.phone}
      timezone={profileTimezone}
      displayCurrency={displayCurrency}
      baseLabels={sectionLabels.baseLabels}
    />
  );

  const renderAccountSection = () => {
    if (!isAdminScope || !staffData) {
      return null;
    }
    return (
      <AccountSection
        mode="view"
        labels={sectionLabels}
        scope={scope}
        staffData={staffData}
        isAdminScope={isAdminScope}
        displayCurrency={displayCurrency}
        targetUserId={targetUserId}
      />
    );
  };

  const renderAdminOnlySection = () => {
    if (!isAdminScope || !staffData) {
      return null;
    }
    return (
      <AdminOnlySection
        mode="view"
        labels={sectionLabels}
        profile={{
          userId: targetUserId,
          name: staffData.name ?? null,
          email: staffData.email ?? null,
          status: staffData.status ?? null,
        }}
      />
    );
  };

  if (mode === ProfileMode.View) {
    return (
      <MobileContentStack>
        {isAdminScope ? (
          <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
            {st.adminBanner}
          </Typography>
        ) : null}
        {renderAccountSection()}
        {renderContactSection()}
        <StaffExtensionProfileSection
          scope={scope}
          labels={sectionLabels}
          hourlyRate={staffData?.hourlyRate}
          rateCurrency={staffData?.rateCurrency}
        />
        {renderAdminOnlySection()}
      </MobileContentStack>
    );
  }

  if (scope === ProfileScope.Own) {
    return (
      <StaffProfileEditForm
        staffData={staffData}
        avatarUrl={avatarUrl}
        displayCurrency={displayCurrency}
        profileTimezone={profileTimezone}
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
      profileTimezone={profileTimezone}
      targetUserId={targetUserId}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={values => onSubmitAdmin(values)}
    />
  );
}
