"use client";

import { Alert } from "@mui/material";
import type React from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { PermissionsSection } from "@/frontend/common/views/dashboard/profile/staff/sections/PermissionsSection";
import type { StaffProfileViewLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { StaffProfileViewModel } from "@/frontend/common/views/dashboard/profile/staff/useStaffProfileViewModel";
import { ProfileScope } from "@/shared/constants/profile.enum";

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

export function staffProfileGuard(props: Readonly<StaffProfileGuardProps>): React.JSX.Element | null {
  const t = props.translations.base;

  if (props.activeTab === "notifications" && props.scope === ProfileScope.OWN) {
    return <NotificationPreferencesTab isActive />;
  }
  if (props.activeTab === "permissions" && props.isAdminScope) {
    return (
      <PermissionsSection permissionGroups={props.permissionGroups} permissionOverrides={props.permissionOverrides} />
    );
  }
  if (props.activeTab !== "profile") {
    return null;
  }
  if (props.loading && !props.staffData) {
    return <LoadingState />;
  }
  if (props.error && !props.staffData) {
    return <ErrorState embedded message={t.errors.failedToLoad} retryLabel={t.actions.retry} onRetry={props.onRetry} />;
  }
  if (!props.staffData) {
    if (!props.canView("core_identity")) {
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
