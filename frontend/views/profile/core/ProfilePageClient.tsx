"use client";

import { useQuery } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProfileAudience, ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments/profile.documents";
import { ParentProfileContainer } from "../parent/ParentProfileContainer";
import { StaffProfileContainer } from "../staff/StaffProfileContainer";
import { TeacherProfileContainer } from "../teacher/TeacherProfileContainer";
import { ProfileShell } from "./ProfileShell";

export type ProfilePageClientProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly targetUserId: string;
};

export function ProfilePageClient({ scope, mode, audience, targetUserId }: ProfilePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(searchParams.get("tab") ?? "");
  const { data, loading, error } = useQuery(profileByUserIdQueryDocument, {
    variables: { userId: targetUserId },
  });

  // Update currentTab when query param changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setCurrentTab(tabParam);
    }
  }, [searchParams]);

  // Update query param when currentTab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentTab) {
      params.set("tab", currentTab);
    } else {
      params.delete("tab");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [currentTab, router, searchParams]);

  const profile = data?.profileByUserId;

  if (loading) {
    return (
      <ProfileShell title="Profile" audience={audience} scope={scope} loading>
        {null}
      </ProfileShell>
    );
  }

  if (error) {
    return (
      <ProfileShell title="Profile" audience={audience} scope={scope} error={error.message}>
        {null}
      </ProfileShell>
    );
  }

  if (!profile) {
    return (
      <ProfileShell title="Profile" audience={audience} scope={scope} error="Profile not found">
        {null}
      </ProfileShell>
    );
  }

  return (
    <ProfileShell
      title="Profile"
      audience={audience}
      scope={scope}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      name={profile.name ?? ""}
      email={profile.email ?? ""}
      role={audience}
      avatarUrl={profile.avatarUrl}
    >
      {audience === "teacher" ? (
        <TeacherProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} />
      ) : audience === "parent" ? (
        <ParentProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} />
      ) : (
        <StaffProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} />
      )}
    </ProfileShell>
  );
}
