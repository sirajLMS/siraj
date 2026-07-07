"use client";

import type { ProfileAudience, ProfileMode, ProfileScope } from "@/backend/types/profile.types";
import { ParentProfileContainer } from "../parent/ParentProfileContainer";
import { StaffProfileContainer } from "../staff/StaffProfileContainer";
import { TeacherProfileContainer } from "../teacher/TeacherProfileContainer";

export type ProfilePageClientProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly targetUserId: string;
};

export function ProfilePageClient({ scope, mode, audience, targetUserId }: ProfilePageClientProps) {
  switch (audience) {
    case "teacher":
      return <TeacherProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} />;
    case "parent":
      return <ParentProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} />;
    default:
      return <StaffProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} />;
  }
}
