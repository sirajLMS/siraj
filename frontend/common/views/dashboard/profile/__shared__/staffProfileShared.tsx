"use client";

import { Alert, Typography } from "@mui/material";
import type React from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { toIanaTimezoneOrNull } from "@/frontend/common/lib/timezone";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { StaffExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/StaffExtensionProfileSection";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { StaffProfileEditForm } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileEditForm";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/staff/sections/AdminOnlySection";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import {
  type StaffProfileViewLabels,
  toStaffSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";

export interface StaffProfileSharedSlots {
  readonly ViewContentWrapper: React.ComponentType<{ readonly children: React.ReactNode }>;
}

type StaffProfileSharedViewProps = Omit<StaffProfileViewModel, "staffData"> &
  Readonly<{ staffData: StaffProfileViewModel["staffData"] | null }> &
  Readonly<StaffProfileSharedSlots>;

export function StaffProfileSharedView({
  labels,
  scope,
  mode,
  isAdminScope,
  loading,
  error,
  refetch,
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
  ViewContentWrapper,
}: Readonly<StaffProfileSharedViewProps>): React.JSX.Element | null {
  const translations = labels;
  const st = labels.staff;

  const guard = staffProfileGuard({
    activeTab,
    scope,
    isAdminScope,
    loading,
    error,
    onRetry: refetch,
    staffData,
    permissionGroups,
    permissionOverrides,
    canView,
    translations,
  });
  if (guard !== null) {
    return guard;
  }

  if (!staffData) {
    return null;
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
      timezone={toIanaTimezoneOrNull(profileTimezone)}
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

  if (mode === ProfileMode.VIEW) {
    return (
      <ViewContentWrapper>
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
      </ViewContentWrapper>
    );
  }

  if (scope === ProfileScope.OWN) {
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

interface StaffProfileGuardProps {
  readonly activeTab: string;
  readonly scope: ProfileScope;
  readonly isAdminScope: boolean;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly onRetry: StaffProfileViewModel["refetch"];
  readonly staffData: StaffProfileViewModel["staffData"] | null | undefined;
  readonly permissionGroups: StaffProfileViewModel["permissionGroups"];
  readonly permissionOverrides: StaffProfileViewModel["permissionOverrides"];
  readonly canView: StaffProfileViewModel["canView"];
  readonly translations: StaffProfileViewLabels;
}

function staffProfileGuard(props: Readonly<StaffProfileGuardProps>): React.JSX.Element | null {
  const {
    activeTab,
    scope,
    isAdminScope,
    loading,
    error,
    onRetry,
    staffData,
    permissionGroups,
    permissionOverrides,
    canView,
    translations,
  } = props;
  const t = translations.base;

  if (activeTab === "notifications" && scope === ProfileScope.OWN) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "permissions" && isAdminScope) {
    return <PermissionsSection permissionGroups={permissionGroups} permissionOverrides={permissionOverrides} />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  if (loading && !staffData) {
    return <LoadingState />;
  }

  if (error && !staffData) {
    return <ErrorState embedded message={t.errors.failedToLoad} retryLabel={t.actions.retry} onRetry={onRetry} />;
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
