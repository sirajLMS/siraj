"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type { ProfileAudience, ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments/profile.documents";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { ProfileActionBar } from "@/frontend/views/dashboard/profile/core/components/ProfileActionBar";
import { ProfileShell } from "@/frontend/views/dashboard/profile/core/ProfileShell";
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

  const editHref = scope === "own" ? `${ownProfileHref()}/edit` : `${profileHrefForUser(targetUserId)}/edit`;
  const cancelHref = scope === "own" ? ownProfileHref() : profileHrefForUser(targetUserId);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const activeTab = currentTab || "profile";

  const roleLabel =
    audience === "staff"
      ? (profile?.staffProfile?.roleName ?? profile?.staffProfile?.roleSlug ?? undefined)
      : t(`role.${audience}`);

  const shellProps = {
    audience,
    scope,
    mode,
    currentTab: mode === "view" ? activeTab : undefined,
    onTabChange: mode === "view" ? setCurrentTab : undefined,
    onRetry: handleRetry,
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    roleLabel,
    avatarUrl: profile?.avatarUrl,
    actions:
      mode === "view" ? (
        <ProfileActionBar mode="view" editHref={editHref} />
      ) : (
        <ProfileActionBar mode="edit" cancelHref={cancelHref} />
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
    if (audience === "teacher") {
      return <TeacherProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
    }
    if (audience === "parent") {
      return <ParentProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
    }
    return <StaffProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
  }

  return <ProfileShell {...shellProps}>{renderProfileContainer()}</ProfileShell>;
}
