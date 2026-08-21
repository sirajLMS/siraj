"use client";

import { Alert, Stack } from "@mui/material";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { TeacherProfileEditForceCompleteGuard } from "@/frontend/common/views/dashboard/components/TeacherProfileEditForceCompleteGuard";
import { ProfileActionBar } from "@/frontend/common/views/dashboard/profile/core/components/ProfileActionBar";
import { ProfileShell } from "@/frontend/common/views/dashboard/profile/core/ProfileShell";
import type { ProfilePageClientProps } from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import {
  PROFILE_AUDIENCE_STUDENT,
  useProfilePageClientViewModel,
} from "@/frontend/common/views/dashboard/profile/core/useProfilePageClientViewModel";
import { ParentAccountActions } from "@/frontend/common/views/dashboard/profile/parent/ParentAccountActions";
import { ParentProfileContainer } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileContainer";
import { StaffProfileView } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileView";
import { TeacherProfileContainer } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileContainer";
import { StudentProfileContainer } from "@/frontend/common/views/dashboard/student/profile/StudentProfileContainer";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";

export type { ProfilePageClientProps };

export function ProfilePageClient(props: Readonly<ProfilePageClientProps>) {
  const viewModel = useProfilePageClientViewModel(props);
  const {
    labels,
    scope,
    mode,
    audience,
    targetUserId,
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
    setCurrentTab,
  } = viewModel;
  const { base: t, teacher: teacherT } = labels;

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
      return <ProfileActionBar mode={ProfileMode.EDIT} cancelHref={cancelHref} labels={t.actions} />;
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
        <ProfileActionBar mode={ProfileMode.VIEW} editHref={editHref} labels={t.actions} />
        {parentActions}
      </Stack>
    );
  }

  if (loading && !profile) {
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

  const showTeacherForceCompleteGuard =
    props.nationalIdComplete !== undefined &&
    scope === ProfileScope.OWN &&
    mode === ProfileMode.EDIT &&
    audience === ProfileAudience.TEACHER;

  function renderProfileContainer() {
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
          studentId={props.studentId}
          activeTab={activeTab}
        />
      );
    }
    return <StaffProfileView scope={scope} mode={mode} targetUserId={targetUserId} activeTab={activeTab} />;
  }

  return (
    <ProfileShell {...shellProps}>
      {showTeacherForceCompleteGuard ? (
        <TeacherProfileEditForceCompleteGuard active nationalIdComplete={props.nationalIdComplete ?? true} />
      ) : null}
      {scope === ProfileScope.OWN && mode === ProfileMode.VIEW ? <DisplayCurrencyHint /> : null}
      {forceComplete && audience === ProfileAudience.TEACHER ? (
        <Alert severity="warning">
          <Stack spacing={0.5}>
            <span>{teacherT.nationalIdCompletion.banner}</span>
            <span>{teacherT.nationalIdCompletion.action}</span>
          </Stack>
        </Alert>
      ) : null}
      {renderProfileContainer()}
    </ProfileShell>
  );
}
