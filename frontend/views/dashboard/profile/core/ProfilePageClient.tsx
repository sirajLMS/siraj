"use client";

import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import type { ProfileAudience, ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments/profile.documents";
import { ownProfileHref, profileHrefForUser } from "@/frontend/utils/profileHref";
import { ParentProfileContainer } from "../parent/ParentProfileContainer";
import { StaffProfileContainer } from "../staff/StaffProfileContainer";
import { TeacherProfileContainer } from "../teacher/TeacherProfileContainer";
import { ProfileActionBar } from "./components/ProfileActionBar";
import { ProfileShell } from "./ProfileShell";

export type ProfilePageClientProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly targetUserId: string;
};

export function ProfilePageClient({ scope, mode, audience, targetUserId }: ProfilePageClientProps) {
  const t = useTranslations("profile");
  const tAudience = useTranslations(`profile.${audience}`);
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(searchParams.get("tab") ?? "");

  const { data, loading, error, refetch } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  const profile = data?.profileByUserId;
  const title = mode === "edit" ? t("editTitle") : t("pageTitle");
  const subtitle = tAudience("subtitle");

  const editHref = scope === "own" ? `${ownProfileHref()}/edit` : `${profileHrefForUser(targetUserId)}/edit`;
  const cancelHref = scope === "own" ? ownProfileHref() : profileHrefForUser(targetUserId);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const activeTab = currentTab || "profile";

  const shellProps = {
    title,
    subtitle,
    audience,
    scope,
    mode,
    currentTab: mode === "view" ? activeTab : undefined,
    onTabChange: mode === "view" ? setCurrentTab : undefined,
    onRetry: handleRetry,
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    role: audience,
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
