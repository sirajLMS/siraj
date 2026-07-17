"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import {
  type CurrencyCode,
  type ProfileMode,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type {
  StaffAdminEditFormData,
  StaffOwnEditFormData,
} from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

function buildEditSource(_scope: ProfileScope, profile: ProfileData): StaffProfileData | null {
  return profile?.staffProfile ?? null;
}

export interface StaffProfileViewModel {
  readonly staffData: StaffProfileData;
  readonly avatarUrl: string | null | undefined;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly isAdminScope: boolean;
  readonly targetUserId: string;
  readonly meetingTabHref: string;
  readonly mode: ProfileMode;
  readonly scope: ProfileScope;
  readonly isSaving: boolean;
  readonly onSubmitOwn: (formData: StaffOwnEditFormData) => Promise<void>;
  readonly onSubmitAdmin: (formData: StaffAdminEditFormData) => Promise<void>;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly refetch: () => void;
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
  readonly permissionGroups: ProfileData["staffPermissionGroups"];
  readonly permissionOverrides: ProfileData["staffPermissionOverrides"];
  readonly canView: (field: string) => boolean;
}

export interface UseStaffProfileViewModelProps {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
}

export function useStaffProfileViewModel(props: Readonly<UseStaffProfileViewModelProps>): StaffProfileViewModel {
  const { scope, mode, targetUserId, activeTab: _activeTab = "profile" } = props;
  const isAdminScope = scope === ProfileScope.Other;
  const activeTab = _activeTab;

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const profile = data?.profileByUserId;
  const staffData = buildEditSource(scope, profile ?? ({} as ProfileData));
  const avatarUrl = profile?.avatarUrl;
  const displayCurrency = profile?.displayCurrency;

  const onSubmitOwn = async (_formData: StaffOwnEditFormData) => {
    // Implementation in container
  };

  const onSubmitAdmin = async (_formData: StaffAdminEditFormData) => {
    // Implementation in container
  };

  const onTabChange = (_tab: string) => {
    // Implementation in container
  };

  const canView = useMemo(() => (_field: string) => true, []);

  return {
    staffData: staffData as StaffProfileData,
    avatarUrl,
    displayCurrency,
    isAdminScope,
    targetUserId,
    meetingTabHref: "?tab=meeting",
    mode,
    scope,
    isSaving: false,
    onSubmitOwn,
    onSubmitAdmin,
    loading,
    error,
    refetch,
    activeTab,
    onTabChange,
    permissionGroups: profile?.staffPermissionGroups ?? [],
    permissionOverrides: profile?.staffPermissionOverrides ?? [],
    canView,
  };
}
