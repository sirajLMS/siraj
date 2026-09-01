"use client";

import { useQuery } from "@apollo/client/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  ProfileAudience as GqlProfileAudience,
  ProfileScope as GqlProfileScope,
  type MeQuery_me,
  type ProfileByUserIdQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useProfileShellTabStore } from "@/frontend/common/stores/profileShellTabStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ownProfileHref, profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { isStudentProfileAudience } from "@/frontend/common/views/dashboard/profile/core/isStudentProfileAudience";
import { getVisibleProfileTabs, resolveProfileTab } from "@/frontend/common/views/dashboard/profile/core/profileTabs";
import type {
  ProfilePageClientLabels,
  ProfilePageClientProps,
} from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ProfileLabels, ProfileRoleLabels } from "@/shared/locale/types/profile";

type ProfileData = NonNullable<ProfileByUserIdQuery["profileByUserId"]>;

const GQL_PROFILE_AUDIENCES = new Set(Object.values(GqlProfileAudience) as readonly string[]);
const GQL_PROFILE_SCOPES = new Set(Object.values(GqlProfileScope) as readonly string[]);

function isGqlProfileAudience(value: string): value is GqlProfileAudience {
  return GQL_PROFILE_AUDIENCES.has(value);
}

function isGqlProfileScope(value: string): value is GqlProfileScope {
  return GQL_PROFILE_SCOPES.has(value);
}

function isProfileRoleKey(value: string): value is keyof ProfileRoleLabels {
  return value === "teacher" || value === "parent" || value === "staff" || value === "student";
}

function buildStudentProfile(
  audience: ProfileAudience,
  scope: ProfileScope,
  targetUserId: string,
  user: MeQuery_me | null,
  userName: string,
  userAvatarUrl: string,
  userEmail: string | null | undefined
): ProfileData {
  return {
    assignedStudents: null,
    associatedStudents: null,
    // Shared profile enums match GraphQL wire values; narrow at the query-type boundary.
    audience: isGqlProfileAudience(audience) ? audience : null,
    avatarUrl: (userAvatarUrl || user?.avatarUrl) ?? null,
    displayCurrency: null,
    email: userEmail ?? user?.email ?? "",
    id: targetUserId,
    meetingConfigs: null,
    name: (userName || user?.name) ?? "",
    parentAdminProfile: null,
    parentId: null,
    parentOwnProfile: null,
    paymentMethodDefaults: null,
    paymentMethods: null,
    phone: null,
    scope: isGqlProfileScope(scope) ? scope : null,
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
  unifiedProfileData: ProfileByUserIdQuery | null | undefined;
  user: MeQuery_me | null;
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
  const editHref = scope === ProfileScope.OWN ? `${ownProfileHref()}/edit` : `${profileHrefForUser(targetUserId)}/edit`;
  const cancelHref = scope === ProfileScope.OWN ? ownProfileHref() : profileHrefForUser(targetUserId);
  return { editHref, cancelHref };
}

/**
 * Creates retry handler and focus refetch callback for profile data.
 */
function useProfileRetry(
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

/**
 * Computes role label based on audience and profile data.
 */
function computeRoleLabel(
  audience: ProfileAudience,
  profile: ProfileData | null | undefined,
  base: ProfileLabels
): string | undefined {
  if (audience === ProfileAudience.STAFF) {
    return profile?.staffProfile?.roleName ?? profile?.staffProfile?.roleSlug ?? undefined;
  }
  const roleKey = audience.toLowerCase();
  return isProfileRoleKey(roleKey) ? base.role[roleKey] : undefined;
}

/**
 * Determines if parent account actions should be shown.
 */
function computeShowParentAccountActions(audience: ProfileAudience, scope: ProfileScope, mode: ProfileMode): boolean {
  return audience === ProfileAudience.PARENT && scope === ProfileScope.OTHER && mode === ProfileMode.VIEW;
}

function useProfileActiveTab(audience: ProfileAudience, scope: ProfileScope) {
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

  const { handleRetry, refetchProfileOnFocus } = useProfileRetry(
    useCallback(() => refetchUnifiedProfile(), [refetchUnifiedProfile]),
    mode
  );

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

export { PROFILE_AUDIENCE_STUDENT } from "@/frontend/common/views/dashboard/profile/core/isStudentProfileAudience";
