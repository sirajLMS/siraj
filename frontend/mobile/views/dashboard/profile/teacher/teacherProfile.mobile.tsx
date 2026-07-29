"use client";

import { Box } from "@mui/material";
import { ProfileMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import { StatsSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/StatsSection";
import { toTeacherSectionLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import {
  hasTeacherCompensationData,
  hasTeacherIdentityData,
  hasTeacherStatsData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates";
import { isTeacherAdminData } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherNonProfileTabContent } from "@/frontend/common/views/dashboard/profile/teacher/TeacherNonProfileTabContent";
import { TeacherProfileEditBody } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import { MobileContentStack } from "@/frontend/mobile/components/ui";

export function TeacherProfileMobileView({
  labels,
  teacherData,
  avatarUrl,
  displayCurrency,
  isAdminScope,
  mode,
  scope,
  targetUserId,
  activeTab,
  isSaving,
  onSubmitOwn,
  onSubmitAdmin,
}: Readonly<TeacherProfileViewModel>) {
  const sectionLabels = toTeacherSectionLabels(labels);

  if (activeTab !== "profile") {
    return <TeacherNonProfileTabContent activeTab={activeTab} scope={scope} targetUserId={targetUserId} />;
  }

  if (!teacherData) {
    return null;
  }

  if (mode === ProfileMode.Edit) {
    return (
      <TeacherProfileEditBody
        labels={labels}
        teacherData={teacherData}
        avatarUrl={avatarUrl}
        displayCurrency={displayCurrency}
        scope={scope}
        targetUserId={targetUserId}
        isSaving={isSaving}
        onSubmitOwn={onSubmitOwn}
        onSubmitAdmin={onSubmitAdmin}
      />
    );
  }

  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  const showCompensation = hasTeacherCompensationData(teacherData);
  const showAdminOnly = isAdminScope && adminData != null && hasTeacherIdentityData(adminData);
  const showStats = hasTeacherStatsData(teacherData);

  return (
    <Box data-testid="teacher-profile-view">
      <MobileContentStack>
        <ContactSection labels={sectionLabels} scope={scope} teacherData={teacherData} isAdminScope={isAdminScope} />
        {showCompensation ? (
          <CompensationSection labels={labels} mode="view" teacherData={teacherData} subjectUserId={targetUserId} />
        ) : null}
        {showAdminOnly && adminData ? (
          <AdminOnlySection labels={sectionLabels} mode="view" adminData={adminData} />
        ) : null}
        {showStats ? <StatsSection labels={labels} teacherData={teacherData} isAdminScope={isAdminScope} /> : null}
      </MobileContentStack>
    </Box>
  );
}
