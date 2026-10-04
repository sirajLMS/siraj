"use client";

import type React from "react";
import { staffProfileGuard } from "@/frontend/common/views/dashboard/profile/__shared__/staffProfileShared.guard";
import {
  StaffProfileEditFormSlot,
  StaffProfileViewContent,
} from "@/frontend/common/views/dashboard/profile/__shared__/staffProfileShared.parts";
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
  const translations: StaffProfileViewLabels = labels;

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
    staff: labels.staff,
    baseLabels: toStaffSharedBaseLabels(translations.base),
  };

  if (mode === ProfileMode.VIEW) {
    return (
      <StaffProfileViewContent
        scope={scope}
        staff={labels.staff}
        staffData={staffData}
        isAdminScope={isAdminScope}
        displayCurrency={displayCurrency}
        targetUserId={targetUserId}
        profilePhone={profilePhone}
        profileTimezone={profileTimezone}
        sectionLabels={sectionLabels}
        ViewContentWrapper={ViewContentWrapper}
      />
    );
  }

  return (
    <StaffProfileEditFormSlot
      staffData={staffData}
      avatarUrl={avatarUrl}
      displayCurrency={displayCurrency}
      profileTimezone={profileTimezone}
      targetUserId={targetUserId}
      isAdminScope={isAdminScope}
      isSaving={isSaving}
      onSubmit={scope === ProfileScope.OWN ? onSubmitOwn : onSubmitAdmin}
    />
  );
}
