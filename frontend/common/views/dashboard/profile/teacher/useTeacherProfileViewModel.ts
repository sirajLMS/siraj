"use client";

import { useQuery } from "@apollo/client/react";
import {
  type CurrencyCode,
  type ProfileMode,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type {
  TeacherAdminData,
  TeacherOwnData,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

function buildEditSource(scope: ProfileScope, profile: ProfileData): TeacherOwnData | TeacherAdminData | null {
  return scope === ProfileScope.Own ? profile.teacherOwnProfile : profile.teacherAdminProfile;
}

export interface TeacherProfileViewModel {
  readonly teacherData: TeacherViewData;
  readonly avatarUrl: string | null | undefined;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly isAdminScope: boolean;
  readonly targetUserId: string;
  readonly meetingTabHref: string;
  readonly mode: ProfileMode;
  readonly scope: ProfileScope;
  readonly isSaving: boolean;
  readonly onSubmitOwn: (formData: {
    name: string;
    email: string;
    phone: string;
    displayCurrency: CurrencyCode | null;
  }) => Promise<void>;
  readonly onSubmitAdmin: (formData: {
    name: string;
    email: string;
    phone: string;
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
  }) => Promise<void>;
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
  const { scope, mode, targetUserId, activeTab: _activeTab = "profile" } = props;
  const isAdminScope = scope === ProfileScope.Other;
  const activeTab = _activeTab;

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    fetchPolicy: "cache-and-network",
  });

  const profile = data?.profileByUserId;
  const teacherData = buildEditSource(scope, profile ?? ({} as ProfileData));
  const avatarUrl = profile?.avatarUrl;
  const displayCurrency = profile?.displayCurrency;

  const onSubmitOwn = async (_formData: {
    name: string;
    email: string;
    phone: string;
    displayCurrency: CurrencyCode | null;
  }) => {
    // Implementation in container
  };

  const onSubmitAdmin = async (_formData: {
    name: string;
    email: string;
    phone: string;
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
  }) => {
    // Implementation in container
  };

  const onTabChange = (_tab: string) => {
    // Implementation in container
  };

  return {
    teacherData: teacherData as TeacherViewData,
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
  };
}

export type { TeacherAdminData, TeacherOwnData, TeacherViewData };
