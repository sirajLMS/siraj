"use client";

import { useQuery } from "@apollo/client/react";
import type { CurrencyCode, ProfileByUserIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type {
  TeacherProfileViewLabels,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import {
  type TeacherAdminSubmitData,
  type TeacherOwnSubmitData,
  useTeacherProfileSubmissions,
} from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileSubmissions";
import { type ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import { Translation, useAppTranslation } from "@/shared/locale";

type ProfileData = NonNullable<ProfileByUserIdQuery["profileByUserId"]>;

function buildEditSource(scope: ProfileScope, profile: ProfileData | null | undefined): TeacherViewData | null {
  if (!profile) {
    return null;
  }
  return scope === ProfileScope.OWN ? profile.teacherOwnProfile : profile.teacherAdminProfile;
}

export type { TeacherAdminSubmitData, TeacherOwnSubmitData };

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
  const isAdminScope = scope === ProfileScope.OTHER;
  const activeTab = _activeTab;

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const profile = data?.profileByUserId;
  const teacherData = buildEditSource(scope, profile);
  const avatarUrl = profile?.avatarUrl;
  const displayCurrency = profile?.displayCurrency;
  const profilePhone = profile?.phone;
  const profileTimezone = profile?.timezone;

  const { isSaving, onSubmitOwn, onSubmitAdmin } = useTeacherProfileSubmissions({
    targetUserId,
    forceComplete,
    refetch,
  });

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
  };
}
