"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ownProfileHref, profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { isStudentProfileAudience } from "@/frontend/common/views/dashboard/profile/core/isStudentProfileAudience";
import type {
  ProfilePageClientLabels,
  ProfilePageClientProps,
} from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ProfileLabels, ProfileRoleLabels } from "@/shared/locale/types/profile";

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

function isProfileRoleKey(value: string): value is keyof ProfileRoleLabels {
  return value === "teacher" || value === "parent" || value === "staff" || value === "student";
}

function buildStudentProfile(
  audience: ProfileAudience,
  scope: ProfileScope,
  targetUserId: string,
  user: User | null,
  userName: string,
  userAvatarUrl: string,
  userEmail: string | null | undefined
): ProfileData {
  return {
    assignedStudents: null,
    associatedStudents: null,
    audience,
    avatarUrl: userAvatarUrl || user?.avatarUrl || null,
    displayCurrency: null,
    email: userEmail ?? user?.email ?? "",
    id: targetUserId,
    meetingConfigs: null,
    name: userName || user?.name || "",
    parentAdminProfile: null,
    parentId: null,
    parentOwnProfile: null,
    paymentMethodDefaults: null,
    paymentMethods: null,
    phone: null,
    scope,
    staffPermissionGroups: null,
    staffPermissionOverrides: null,
    staffProfile: null,
    staffProfileId: null,
    teacherAdminProfile: null,
    teacherId: null,
    teacherOwnProfile: null,
    timezone: null,
    userId: targetUserId,
  };
}

interface UseProfileDataParams {
  isStudentAudience: boolean;
  audience: ProfileAudience;
  scope: ProfileScope;
  targetUserId: string;
  unifiedProfileData: Operations.ProfileByUserIdQuery | null | undefined;
  user: User | null;
  userName: string;
  userAvatarUrl: string;
  userEmail: string | null | undefined;
}

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

/**
 * Computes the profile data based on audience type.
 * For student audience, returns user data from store.
 * For other audiences, returns data from GraphQL query.
 */
function useProfileData(params: UseProfileDataParams): ProfileData | null | undefined {
  const {
    isStudentAudience,
    audience,
    scope,
    targetUserId,
    unifiedProfileData,
    user,
    userName,
    userAvatarUrl,
    userEmail,
  } = params;

  return useMemo((): ProfileData | null | undefined => {
    if (isStudentAudience) {
      return buildStudentProfile(audience, scope, targetUserId, user, userName, userAvatarUrl, userEmail);
    }
    return unifiedProfileData?.profileByUserId;
  }, [
    audience,
    isStudentAudience,
    scope,
    targetUserId,
    unifiedProfileData?.profileByUserId,
    user,
    userAvatarUrl,
    userName,
    userEmail,
  ]);
}

/**
 * Computes edit and cancel hrefs based on scope and target user.
 */
function computeHrefs(scope: ProfileScope, targetUserId: string): { editHref: string; cancelHref: string } {
  const editHref = scope === ProfileScope.Own ? `${ownProfileHref()}/edit` : `${profileHrefForUser(targetUserId)}/edit`;
  const cancelHref = scope === ProfileScope.Own ? ownProfileHref() : profileHrefForUser(targetUserId);
  return { editHref, cancelHref };
}

/**
 * Creates retry handler and focus refetch callback for profile data.
 */
function useProfileRetry(
  refetchUnifiedProfile: () => Promise<{ data?: Operations.ProfileByUserIdQuery; error?: Error }>,
  mode: ProfileMode
): { handleRetry: () => void; refetchProfileOnFocus: () => void } {
  const handleRetry = useCallback(() => {
    void refetchUnifiedProfile();
  }, [refetchUnifiedProfile]);

  const refetchProfileOnFocus = useCallback(() => {
    if (mode === ProfileMode.View) {
      handleRetry();
    }
  }, [handleRetry, mode]);

  return { handleRetry, refetchProfileOnFocus };
}

/**
 * Computes role label based on audience and profile data.
 */
function computeRoleLabel(
  audience: ProfileAudience,
  profile: ProfileData | null | undefined,
  base: ProfileLabels
): string | undefined {
  if (audience === ProfileAudience.Staff) {
    return profile?.staffProfile?.roleName ?? profile?.staffProfile?.roleSlug ?? undefined;
  }
  const roleKey = audience.toLowerCase();
  return isProfileRoleKey(roleKey) ? base.role[roleKey] : undefined;
}

/**
 * Determines if parent account actions should be shown.
 */
function computeShowParentAccountActions(audience: ProfileAudience, scope: ProfileScope, mode: ProfileMode): boolean {
  return audience === ProfileAudience.Parent && scope === ProfileScope.Other && mode === ProfileMode.View;
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
  const [currentTab, setCurrentTab] = useState(() => searchParams.get("tab") ?? "profile");

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

  useDocumentTitle(profile?.name, Translation.Profile.Base, mode === ProfileMode.Edit ? "editTitle" : "pageTitle");

  const { editHref, cancelHref } = computeHrefs(scope, targetUserId);

  const { handleRetry, refetchProfileOnFocus } = useProfileRetry(
    useCallback(() => refetchUnifiedProfile(), [refetchUnifiedProfile]),
    mode
  );

  useRefetchOnWindowFocus(refetchProfileOnFocus);

  const activeTab = currentTab;
  const isViewMode = mode === ProfileMode.View;

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

export {
  isStudentProfileAudience,
  PROFILE_AUDIENCE_STUDENT,
} from "@/frontend/common/views/dashboard/profile/core/isStudentProfileAudience";
