"use client";

import { Alert, Stack } from "@mui/material";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { TeacherProfileEditForceCompleteGuard } from "@/frontend/common/views/dashboard/components/TeacherProfileEditForceCompleteGuard";
import {
  ProfileAudienceContainer,
  ProfilePageActions,
} from "@/frontend/common/views/dashboard/profile/core/ProfilePageClient.parts";
import { ProfileShell } from "@/frontend/common/views/dashboard/profile/core/ProfileShell";
import type { ProfilePageClientProps } from "@/frontend/common/views/dashboard/profile/core/types/profilePageClient.types";
import { useProfilePageClientViewModel } from "@/frontend/common/views/dashboard/profile/core/useProfilePageClientViewModel";
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

  const actions = (
    <ProfilePageActions
      isViewMode={isViewMode}
      editHref={editHref}
      cancelHref={cancelHref}
      showParentAccountActions={showParentAccountActions}
      profile={profile}
      targetUserId={targetUserId}
      labels={t.actions}
    />
  );

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
    actions,
  };

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
      <ProfileAudienceContainer
        audience={audience}
        scope={scope}
        mode={mode}
        targetUserId={targetUserId}
        activeTab={activeTab}
        forceComplete={forceComplete}
        studentId={props.studentId}
      />
    </ProfileShell>
  );
}
