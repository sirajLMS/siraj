"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { MeQuery_me, ProfileByUserIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { useProfileShellTabStore } from "@/frontend/common/stores/profileShellTabStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisibleProfileTabs, resolveProfileTab } from "@/frontend/common/views/dashboard/profile/core/profileTabs";
import {
  buildStudentProfile,
  type ProfileData,
} from "@/frontend/common/views/dashboard/profile/core/useProfilePageClientViewModel.helpers";
import { type ProfileAudience, ProfileMode, type ProfileScope } from "@/shared/constants/profile.enum";

export interface UseProfileDataParams {
  isStudentAudience: boolean;
  audience: ProfileAudience;
  scope: ProfileScope;
  targetUserId: string;
  unifiedProfileData: ProfileByUserIdQuery | null | undefined;
  user: MeQuery_me | null;
  userName: string;
  userAvatarUrl: string;
  userEmail: string | null | undefined;
}

/**
 * Computes the profile data based on audience type.
 * For student audience, returns user data from store.
 * For other audiences, returns data from GraphQL query.
 */
export function useProfileData(params: UseProfileDataParams): ProfileData | null | undefined {
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
 * Creates retry handler and focus refetch callback for profile data.
 */
export function useProfileRetry(
  refetchUnifiedProfile: () => Promise<{ data?: ProfileByUserIdQuery; error?: Error }>,
  mode: ProfileMode
): { handleRetry: () => void; refetchProfileOnFocus: () => void } {
  const handleRetry = useCallback(() => {
    void refetchUnifiedProfile();
  }, [refetchUnifiedProfile]);

  const refetchProfileOnFocus = useCallback(() => {
    if (mode === ProfileMode.VIEW) {
      handleRetry();
    }
  }, [handleRetry, mode]);

  return { handleRetry, refetchProfileOnFocus };
}

export function useProfileActiveTab(audience: ProfileAudience, scope: ProfileScope) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const hasPermission = useUserStore(state => state.hasPermission);
  const storedTab = useProfileShellTabStore(state => state.activeTabByRoute[pathname]);
  const setStoredTab = useProfileShellTabStore(state => state.setActiveTab);

  const visibleTabs = getVisibleProfileTabs({ audience, scope, hasPermission });
  const storedVisibleTab = storedTab && visibleTabs.some(tab => tab.id === storedTab) ? storedTab : undefined;
  const currentTab = storedVisibleTab ?? resolveProfileTab(searchParams.get("tab"), visibleTabs) ?? "profile";
  const setCurrentTab = useCallback(
    (tab: string) => {
      setStoredTab(pathname, tab);
    },
    [pathname, setStoredTab]
  );

  return { currentTab, setCurrentTab };
}
