"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { isStudentProfileAudience } from "@/frontend/common/views/dashboard/profile/core/isStudentProfileAudience";
import type {
  ProfilePageClientLabels,
  ProfilePageClientProps,
} from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import {
  computeHrefs,
  computeRoleLabel,
  computeShowParentAccountActions,
  type ProfileData,
} from "@/frontend/common/views/dashboard/profile/core/useProfilePageClientViewModel.helpers";
import {
  useProfileActiveTab,
  useProfileData,
  useProfileRetry,
} from "@/frontend/common/views/dashboard/profile/core/useProfilePageClientViewModel.hooks";
import { ProfileMode } from "@/shared/constants/profile.enum";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface ProfilePageClientViewModel extends ProfilePageClientProps {
  readonly labels: ProfilePageClientLabels;
  readonly currentTab: string;
  readonly setCurrentTab: (tab: string) => void;
  readonly forceComplete: boolean;
  readonly loading: boolean;
  readonly error: unknown;
  readonly profile: ProfileData | null | undefined;
  readonly editHref: string;
  readonly cancelHref: string;
  readonly handleRetry: () => void;
  readonly roleLabel: string | undefined;
  readonly showParentAccountActions: boolean;
  readonly isViewMode: boolean;
  readonly activeTab: string;
}

export function useProfilePageClientViewModel(props: Readonly<ProfilePageClientProps>): ProfilePageClientViewModel {
  const { scope, mode, audience, targetUserId } = props;
  const isStudentAudience = isStudentProfileAudience(audience);
  const user = useUserStore(state => state.user);
  const userName = useUserStore(state => state.name);
  const userAvatarUrl = useUserStore(state => state.avatarUrl);
  const base = useAppTranslation(Translation.Profile.Base);
  const teacher = useAppTranslation(Translation.Profile.Teacher);
  const labels: ProfilePageClientLabels = { base, teacher };

  const searchParams = useSearchParams();
  const forceComplete = searchParams.get("forceComplete") === "1";
  const { currentTab, setCurrentTab } = useProfileActiveTab(audience, scope);

  const {
    data: unifiedProfileData,
    loading: unifiedLoading,
    error: unifiedError,
    refetch: refetchUnifiedProfile,
  } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
    skip: isStudentAudience,
  });

  const profile = useProfileData({
    isStudentAudience,
    audience,
    scope,
    targetUserId,
    unifiedProfileData,
    user,
    userName,
    userAvatarUrl,
    userEmail: user?.email ?? null,
  });

  const loading = isStudentAudience ? false : unifiedLoading;
  const error = isStudentAudience ? undefined : unifiedError;

  useDocumentTitle(profile?.name, Translation.Profile.Base, mode === ProfileMode.EDIT ? "editTitle" : "pageTitle");

  const { editHref, cancelHref } = computeHrefs(scope, targetUserId);

  const { handleRetry, refetchProfileOnFocus } = useProfileRetry(refetchUnifiedProfile, mode);

  useRefetchOnWindowFocus(refetchProfileOnFocus);

  const activeTab = currentTab;
  const isViewMode = mode === ProfileMode.VIEW;

  const roleLabel = computeRoleLabel(audience, profile, base);

  const showParentAccountActions = computeShowParentAccountActions(audience, scope, mode);

  return {
    scope,
    mode,
    audience,
    targetUserId,
    labels,
    currentTab,
    setCurrentTab,
    forceComplete,
    loading,
    error,
    profile,
    editHref,
    cancelHref,
    handleRetry,
    roleLabel,
    showParentAccountActions,
    isViewMode,
    activeTab,
  };
}
