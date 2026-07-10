"use client";

import { useQuery } from "@apollo/client/react";
import { Stack } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { useRefetchOnWindowFocus } from "@/frontend/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { ProfileActionBar } from "@/frontend/views/dashboard/profile/core/components/ProfileActionBar";
import { ProfileShell } from "@/frontend/views/dashboard/profile/core/ProfileShell";
import { ParentAccountActions } from "@/frontend/views/dashboard/profile/parent/ParentAccountActions";
import { ParentProfileContainer } from "@/frontend/views/dashboard/profile/parent/ParentProfileContainer";
import { StaffProfileContainer } from "@/frontend/views/dashboard/profile/staff/StaffProfileContainer";
import { TeacherProfileContainer } from "@/frontend/views/dashboard/profile/teacher/TeacherProfileContainer";

export type ProfilePageClientProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly targetUserId: string;
};

export function ProfilePageClient({ scope, mode, audience, targetUserId }: ProfilePageClientProps) {
  const t = useTranslations("profile");
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(searchParams.get("tab") ?? "");

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  const profile = data?.profileByUserId;

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

  const activeTab = currentTab || "profile";

  const roleLabel =
    audience === ProfileAudience.Staff
      ? (profile?.staffProfile?.roleName ?? profile?.staffProfile?.roleSlug ?? undefined)
      : t(`role.${audience}`);

  const showParentAccountActions =
    audience === ProfileAudience.Parent && scope === ProfileScope.Other && mode === ProfileMode.View;

  const shellProps = {
    audience,
    scope,
    mode,
    currentTab: mode === ProfileMode.View ? activeTab : undefined,
    onTabChange: mode === ProfileMode.View ? setCurrentTab : undefined,
    onRetry: handleRetry,
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    roleLabel,
    avatarUrl: profile?.avatarUrl,
    actions:
      mode === ProfileMode.View ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <ProfileActionBar mode={ProfileMode.View} editHref={editHref} />
          {showParentAccountActions && profile?.parentId ? (
            <ParentAccountActions
              parentId={profile.parentId}
              targetUserId={targetUserId}
              accountStatus={profile.parentAdminProfile?.accountStatus}
            />
          ) : null}
        </Stack>
      ) : (
        <ProfileActionBar mode={ProfileMode.Edit} cancelHref={cancelHref} />
      ),
  };

  if (loading && !data) {
    return (
      <ProfileShell {...shellProps} loading>
        {null}
      </ProfileShell>
    );
  }

  if (error) {
    return (
      <ProfileShell {...shellProps} error={t("errors.failedToLoad")}>
        {null}
      </ProfileShell>
    );
  }

  if (!profile) {
    return (
      <ProfileShell {...shellProps} error={t("errors.notFound")}>
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
    return <StaffProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
  }

  return (
    <ProfileShell {...shellProps}>
      {scope === ProfileScope.Own && mode === ProfileMode.View ? <DisplayCurrencyHint /> : null}
      {renderProfileContainer()}
    </ProfileShell>
  );
}
