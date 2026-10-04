"use client";

import { Stack } from "@mui/material";
import type React from "react";
import { ProfileActionBar } from "@/frontend/common/views/dashboard/profile/core/components/ProfileActionBar";
import { PROFILE_AUDIENCE_STUDENT } from "@/frontend/common/views/dashboard/profile/core/isStudentProfileAudience";
import type { ProfileActionBarLabels } from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import type { ProfileData } from "@/frontend/common/views/dashboard/profile/core/useProfilePageClientViewModel.helpers";
import { ParentAccountActions } from "@/frontend/common/views/dashboard/profile/parent/ParentAccountActions";
import { ParentProfileContainer } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileContainer";
import { StaffProfileView } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileView";
import { TeacherProfileContainer } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileContainer";
import { StudentProfileContainer } from "@/frontend/common/views/dashboard/student/profile/StudentProfileContainer";
import { ProfileAudience, ProfileMode, type ProfileScope } from "@/shared/constants/profile.enum";

interface ProfilePageActionsProps {
  readonly isViewMode: boolean;
  readonly editHref: string;
  readonly cancelHref: string;
  readonly showParentAccountActions: boolean;
  readonly profile: ProfileData | null | undefined;
  readonly targetUserId: string;
  readonly labels: ProfileActionBarLabels;
}

export function ProfilePageActions(props: Readonly<ProfilePageActionsProps>): React.JSX.Element {
  if (!props.isViewMode) {
    return <ProfileActionBar mode={ProfileMode.EDIT} cancelHref={props.cancelHref} labels={props.labels} />;
  }

  const parentActions =
    props.showParentAccountActions && props.profile?.parentId ? (
      <ParentAccountActions
        parentId={props.profile.parentId}
        targetUserId={props.targetUserId}
        accountStatus={props.profile.parentAdminProfile?.accountStatus}
      />
    ) : null;

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      <ProfileActionBar mode={ProfileMode.VIEW} editHref={props.editHref} labels={props.labels} />
      {parentActions}
    </Stack>
  );
}

interface ProfileAudienceContainerProps {
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly targetUserId: string;
  readonly activeTab: string;
  readonly forceComplete: boolean;
  readonly studentId?: string;
}

export function ProfileAudienceContainer(props: Readonly<ProfileAudienceContainerProps>): React.JSX.Element {
  const { audience, scope, mode, targetUserId, activeTab, forceComplete, studentId } = props;

  if (audience === ProfileAudience.TEACHER) {
    return (
      <TeacherProfileContainer
        scope={scope}
        mode={mode}
        targetUserId={targetUserId}
        activeTab={activeTab}
        forceComplete={forceComplete}
      />
    );
  }
  if (audience === ProfileAudience.PARENT) {
    return <ParentProfileContainer scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
  }
  if (audience === PROFILE_AUDIENCE_STUDENT) {
    return (
      <StudentProfileContainer
        scope={scope}
        mode={mode}
        targetUserId={targetUserId}
        studentId={studentId}
        activeTab={activeTab}
      />
    );
  }
  return <StaffProfileView scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
}
