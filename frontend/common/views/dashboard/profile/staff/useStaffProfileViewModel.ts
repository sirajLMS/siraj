"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import {
  type CurrencyCode,
  type ProfileMode,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type {
  StaffProfileData,
  StaffProfileViewLabels,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type {
  StaffAdminEditFormData,
  StaffOwnEditFormData,
} from "@/frontend/common/views/dashboard/profile/staff/staffProfileFormTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

function buildEditSource(_scope: ProfileScope, profile: ProfileData): StaffProfileData | null {
  return profile?.staffProfile ?? null;
}

export interface StaffProfileViewModel {
  readonly labels: StaffProfileViewLabels;
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
  const base = useAppTranslation(Translation.Profile.Base);
  const staff = useAppTranslation(Translation.Profile.Staff);
  const labels: StaffProfileViewLabels = { base, staff };

  const { scope, mode, targetUserId, activeTab: _activeTab = "profile" } = props;
  const isAdminScope = scope === ProfileScope.Other;
  const activeTab = _activeTab;
  const [isSaving, setIsSaving] = useState(false);

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const [updateOwnProfile] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile] = useMutation(updateUserProfileMutationDocument);

  const profile = data?.profileByUserId;
  const staffData = buildEditSource(scope, profile ?? ({} as ProfileData));
  const avatarUrl = profile?.avatarUrl ?? staffData?.avatarUrl;
  const displayCurrency = profile?.displayCurrency;

  const onSubmitOwn = async (formData: StaffOwnEditFormData) => {
    setIsSaving(true);
    try {
      await updateOwnProfile({
        variables: {
          input: {
            core: {
              name: formData.name,
              email: formData.email,
              avatarUrl: formData.avatarUrl,
              displayCurrency: formData.displayCurrency,
            },
            staff: {
              phone: formData.phone || null,
            },
          },
        },
      });
      await refetch();
    } catch (submitError) {
      logger.error("Failed to update own staff profile", { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitAdmin = async (formData: StaffAdminEditFormData) => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        variables: {
          userId: targetUserId,
          input: {
            core: {
              name: formData.name,
              email: formData.email,
              avatarUrl: formData.avatarUrl,
              displayCurrency: formData.displayCurrency,
            },
            staff: {
              status: formData.status ?? null,
              hourlyRate: formData.hourlyRate || null,
              rateCurrency: formData.rateCurrency ?? null,
            },
          },
        },
      });
      await refetch();
    } catch (submitError) {
      logger.error("Failed to update staff profile", { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  const onTabChange = (_tab: string) => {
    // Tab routing is owned by the profile shell / URL.
  };

  const canView = useMemo(() => (_field: string) => true, []);

  return {
    labels,
    staffData: staffData as StaffProfileData,
    avatarUrl,
    displayCurrency,
    isAdminScope,
    targetUserId,
    meetingTabHref: "?tab=meeting",
    mode,
    scope,
    isSaving,
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
