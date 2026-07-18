"use client";

import { useQuery } from "@apollo/client/react";
import { Stack } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { ownProfileHref, profileHrefForUser } from "@/frontend/common/utils/profileHref";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { ProfileActionBar } from "@/frontend/common/views/dashboard/profile/core/components/ProfileActionBar";
import { ProfileShell } from "@/frontend/common/views/dashboard/profile/core/ProfileShell";
import { ParentAccountActions } from "@/frontend/common/views/dashboard/profile/parent/ParentAccountActions";
import { ParentProfileContainer } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileContainer";
import { StaffProfileContainer } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileContainer";
import { TeacherProfileContainer } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileContainer";
import { StudentProfileContainer } from "@/frontend/common/views/dashboard/student/profile/StudentProfileContainer";
import { useAppTranslation } from "@/shared/locale";

const PROFILE_AUDIENCE_STUDENT = "STUDENT" as ProfileAudience;

export type ProfilePageClientProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly targetUserId: string;
};

export function ProfilePageClient({ scope, mode, audience, targetUserId }: ProfilePageClientProps) {
  const t = useAppTranslation().profileTranslations.base;
  const searchParams = useSearchParams();
  // Prefer the URL tab; fall back to "profile" only for the initial paint before
  // ProfileTabNav normalizes a missing/invalid ?tab=. Do not feed a default
  // "profile" back into the URL — that raced with hydration and caused redirects.
  const [currentTab, setCurrentTab] = useState(() => searchParams.get("tab") ?? "profile");

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  const profile = data?.profileByUserId;

  useDocumentTitle(profile?.name, "profile", mode === ProfileMode.Edit ? "editTitle" : "pageTitle");

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

  // Dynamic i18n lookup: `audience` is a bounded union (ProfileAudience) whose
  // string values map onto keys of `t.role`, so we cast into the typed role
  // label map. The staff cohort is handled separately (no role label).
  const roleLabel =
    audience === ProfileAudience.Staff
      ? (profile?.staffProfile?.roleName ?? profile?.staffProfile?.roleSlug ?? undefined)
      : t.role[audience.toLowerCase() as keyof typeof t.role];

  const showParentAccountActions =
    audience === ProfileAudience.Parent && scope === ProfileScope.Other && mode === ProfileMode.View;

  const isViewMode = mode === ProfileMode.View;
  const shellProps = {
    audience,
    scope,
    mode,
    currentTab: isViewMode ? activeTab : undefined,
    onTabChange: isViewMode ? setCurrentTab : undefined,
    onRetry: handleRetry,
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    roleLabel,
    avatarUrl: profile?.avatarUrl,
    actions: renderActions(),
  };

  function renderActions() {
    if (!isViewMode) {
      return <ProfileActionBar mode={ProfileMode.Edit} cancelHref={cancelHref} />;
    }

    const parentActions =
      showParentAccountActions && profile?.parentId ? (
        <ParentAccountActions
          parentId={profile.parentId}
          targetUserId={targetUserId}
          accountStatus={profile.parentAdminProfile?.accountStatus}
        />
      ) : null;

    return (
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <ProfileActionBar mode={ProfileMode.View} editHref={editHref} />
        {parentActions}
      </Stack>
    );
  }

  if (loading && !data) {
    return (
      <ProfileShell {...shellProps} loading>
        {null}
      </ProfileShell>
    );
  }

  if (error) {
    return (
      <ProfileShell {...shellProps} error={t.errors.failedToLoad}>
        {null}
      </ProfileShell>
    );
  }

  if (!profile) {
    return (
      <ProfileShell {...shellProps} error={t.errors.notFound}>
        {null}
      </ProfileShell>
    );
  }

  function renderProfileContainer() {
    if (audience === ProfileAudience.Teacher) {
      return <TeacherProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
    }
    if (audience === ProfileAudience.Parent) {
      return <ParentProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
    }
    if (audience === PROFILE_AUDIENCE_STUDENT) {
      return <StudentProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
    }
    return <StaffProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
  }

  return (
    <ProfileShell {...shellProps}>
      {scope === ProfileScope.Own && mode === ProfileMode.View ? <DisplayCurrencyHint /> : null}
      {renderProfileContainer()}
    </ProfileShell>
  );
}
