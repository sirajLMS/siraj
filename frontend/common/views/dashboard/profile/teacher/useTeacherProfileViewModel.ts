"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import {
  type AccountStatus,
  type CurrencyCode,
  type Gender,
  type ProfileMode,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  profileByUserIdQueryDocument,
  updateOwnProfileMutationDocument,
  updateUserProfileMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { isTeacherNationalIdComplete } from "@/frontend/common/lib/profileCompletion";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { logger } from "@/frontend/common/utils/logger";
import { ownProfileHref } from "@/frontend/common/utils/profileHref";
import type {
  TeacherProfileViewLabels,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

function buildEditSource(scope: ProfileScope, profile: ProfileData | null | undefined): TeacherViewData | null {
  if (!profile) {
    return null;
  }
  return scope === ProfileScope.Own ? profile.teacherOwnProfile : profile.teacherAdminProfile;
}

const onTabChange = (_tab: string) => {
  // Tab routing is owned by the profile shell / URL.
};

export type TeacherOwnSubmitData = {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  nationality: string;
  avatarUrl?: string | null;
  displayCurrency: CurrencyCode | null;
  timezone?: string;
};

export type TeacherAdminSubmitData = {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  nationalId: string;
  nationality: string;
  dateOfBirth: string;
  gender: Gender | null;
  address: string;
  qualifications: string;
  timezone: string;
  hourlyRate: string;
  rateCurrency: CurrencyCode | undefined;
  status: AccountStatus | null;
  displayCurrency: CurrencyCode | null;
};

export interface TeacherProfileViewModel {
  readonly labels: TeacherProfileViewLabels;
  readonly teacherData: TeacherViewData | null;
  readonly avatarUrl: string | null | undefined;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly profilePhone: string | null | undefined;
  readonly profileTimezone: string | null | undefined;
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
  readonly forceComplete?: boolean;
}

export function useTeacherProfileViewModel(props: Readonly<UseTeacherProfileViewModelProps>): TeacherProfileViewModel {
  const base = useAppTranslation(Translation.Profile.Base);
  const teacher = useAppTranslation(Translation.Profile.Teacher);
  const dashboard = useAppTranslation(Translation.Dashboard.TeacherProfile);
  const errors = useAppTranslation(Translation.Errors);
  const labels: TeacherProfileViewLabels = { base, teacher, dashboard, errors };

  const { scope, mode, targetUserId, activeTab: _activeTab = "profile", forceComplete = false } = props;
  const isAdminScope = scope === ProfileScope.Other;
  const activeTab = _activeTab;
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const [updateOwnProfile] = useMutation(updateOwnProfileMutationDocument);
  const [updateUserProfile] = useMutation(updateUserProfileMutationDocument);

  const profile = data?.profileByUserId;
  const teacherData = buildEditSource(scope, profile);
  const avatarUrl = profile?.avatarUrl;
  const displayCurrency = profile?.displayCurrency;
  const profilePhone = profile?.phone;
  const profileTimezone = profile?.timezone;

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
              timezone: formData.timezone ? toGraphqlIanaTimezone(formData.timezone) : null,
            },
          },
        },
      });

      if (forceComplete && isTeacherNationalIdComplete(formData.nationalId)) {
        router.replace(ownProfileHref());
        router.refresh();
        return;
      }

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
              nationality: formData.nationality || null,
              dateOfBirth: formData.dateOfBirth || null,
              gender: formData.gender,
              address: formData.address || null,
              qualifications: formData.qualifications || null,
              timezone: formData.timezone ? toGraphqlIanaTimezone(formData.timezone) : null,
              hourlyRate: formData.hourlyRate || null,
              rateCurrency: formData.rateCurrency ?? null,
              status: formData.status,
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

  return {
    labels,
    teacherData,
    avatarUrl,
    displayCurrency,
    profilePhone,
    profileTimezone,
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
