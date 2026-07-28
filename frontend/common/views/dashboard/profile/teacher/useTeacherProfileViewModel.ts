"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import {
  type AccountStatus,
  type CurrencyCode,
  type Gender,
  type IanaTimezone,
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
  TeacherAdminData,
  TeacherOwnData,
  TeacherProfileViewLabels,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

function buildEditSource(scope: ProfileScope, profile: ProfileData): TeacherOwnData | TeacherAdminData | null {
  return scope === ProfileScope.Own ? profile.teacherOwnProfile : profile.teacherAdminProfile;
}

export type TeacherOwnSubmitData = {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  nationality: string;
  avatarUrl?: string | null;
  displayCurrency: CurrencyCode | null;
};

export type TeacherAdminSubmitData = {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  nationalId: string;
  dateOfBirth: string;
  gender: string | null;
  address: string;
  qualifications: string;
  timezone: string;
  hourlyRate: string;
  rateCurrency: CurrencyCode | undefined;
  status: string;
  displayCurrency: CurrencyCode | null;
};

export interface TeacherProfileViewModel {
  readonly labels: TeacherProfileViewLabels;
  readonly teacherData: TeacherViewData;
  readonly avatarUrl: string | null | undefined;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly isAdminScope: boolean;
  readonly targetUserId: string;
  readonly meetingTabHref: string;
  readonly mode: ProfileMode;
  readonly scope: ProfileScope;
  readonly isSaving: boolean;
  readonly onSubmitOwn: (formData: TeacherOwnSubmitData) => Promise<void>;
  readonly onSubmitAdmin: (formData: TeacherAdminSubmitData) => Promise<void>;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly refetch: () => void;
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
}

export interface UseTeacherProfileViewModelProps {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab?: string;
}

export function useTeacherProfileViewModel(props: Readonly<UseTeacherProfileViewModelProps>): TeacherProfileViewModel {
  const base = useAppTranslation(Translation.Profile.Base);
  const teacher = useAppTranslation(Translation.Profile.Teacher);
  const dashboard = useAppTranslation(Translation.Dashboard.TeacherProfile);
  const errors = useAppTranslation(Translation.Errors);
  const labels: TeacherProfileViewLabels = { base, teacher, dashboard, errors };

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
  const teacherData = buildEditSource(scope, profile ?? ({} as ProfileData));
  const avatarUrl = profile?.avatarUrl;
  const displayCurrency = profile?.displayCurrency;

  const onSubmitOwn = async (formData: TeacherOwnSubmitData) => {
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
            teacher: {
              phone: formData.phone || null,
              nationalId: formData.nationalId || null,
              nationality: formData.nationality || null,
            },
          },
        },
      });
      await refetch();
    } catch (submitError) {
      logger.error("Failed to update own teacher profile", { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitAdmin = async (formData: TeacherAdminSubmitData) => {
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
            teacher: {
              phone: formData.phone || null,
              nationalId: formData.nationalId || null,
              dateOfBirth: formData.dateOfBirth || null,
              gender: (formData.gender as Gender | null) ?? null,
              address: formData.address || null,
              qualifications: formData.qualifications || null,
              timezone: (formData.timezone || null) as IanaTimezone | null,
              hourlyRate: formData.hourlyRate || null,
              rateCurrency: formData.rateCurrency ?? null,
              status: (formData.status || null) as AccountStatus | null,
            },
          },
        },
      });
      await refetch();
    } catch (submitError) {
      logger.error("Failed to update teacher profile", { error: submitError });
      throw submitError;
    } finally {
      setIsSaving(false);
    }
  };

  const onTabChange = (_tab: string) => {
    // Tab routing is owned by the profile shell / URL.
  };

  return {
    labels,
    teacherData: teacherData as TeacherViewData,
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
  };
}

export type { TeacherAdminData, TeacherOwnData, TeacherViewData };
