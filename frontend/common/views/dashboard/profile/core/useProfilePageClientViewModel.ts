"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { ownProfileHref, profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import type {
  ProfilePageClientLabels,
  ProfilePageClientProps,
} from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import { Translation, useAppTranslation } from "@/shared/locale";

const PROFILE_AUDIENCE_STUDENT = "STUDENT" as ProfileAudience;

type ProfileData = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>;

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
  const base = useAppTranslation(Translation.Profile.Base);
  const teacher = useAppTranslation(Translation.Profile.Teacher);
  const labels: ProfilePageClientLabels = { base, teacher };

  const searchParams = useSearchParams();
  const forceComplete = searchParams.get("forceComplete") === "1";
  const [currentTab, setCurrentTab] = useState(() => searchParams.get("tab") ?? "profile");

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  const profile = data?.profileByUserId;

  useDocumentTitle(profile?.name, Translation.Profile.Base, mode === ProfileMode.Edit ? "editTitle" : "pageTitle");

  const editHref = scope === ProfileScope.Own ? `${ownProfileHref()}/edit` : `${profileHrefForUser(targetUserId)}/edit`;
  const cancelHref = scope === ProfileScope.Own ? ownProfileHref() : profileHrefForUser(targetUserId);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const refetchProfileOnFocus = useCallback(() => {
    if (mode === ProfileMode.View) {
      void refetch();
    }
  }, [mode, refetch]);

  useRefetchOnWindowFocus(refetchProfileOnFocus);

  const activeTab = currentTab;
  const isViewMode = mode === ProfileMode.View;

  const roleLabel =
    audience === ProfileAudience.Staff
      ? (profile?.staffProfile?.roleName ?? profile?.staffProfile?.roleSlug ?? undefined)
      : base.role[audience.toLowerCase() as keyof typeof base.role];

  const showParentAccountActions =
    audience === ProfileAudience.Parent && scope === ProfileScope.Other && mode === ProfileMode.View;

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

export { PROFILE_AUDIENCE_STUDENT };
