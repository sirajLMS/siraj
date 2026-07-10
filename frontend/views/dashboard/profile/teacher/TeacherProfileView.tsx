"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { ProfileScope, type CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { MeetingSummarySection } from "@/frontend/views/dashboard/profile/shared/MeetingSummarySection";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useProfileFieldAccess } from "@/frontend/views/dashboard/profile/shared/useProfileFieldAccess";
import { AccountSection } from "@/frontend/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/views/dashboard/profile/teacher/sections/ContactSection";
import { StatsSection } from "@/frontend/views/dashboard/profile/teacher/sections/StatsSection";
import {
  isTeacherAdminData,
  type TeacherAdminData,
  type TeacherViewData,
} from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";

function hasTeacherProfessionalData(teacherData: TeacherViewData): boolean {
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  const qualifications = "qualifications" in teacherData ? teacherData.qualifications : null;
  return Boolean(
    qualifications?.trim() ||
      teacherData.hourlyRate?.trim() ||
      teacherData.rateCurrency ||
      teacherData.totalClasses != null ||
      adminData?.avgEngagementScore != null
  );
}

function hasTeacherIdentityData(adminData: TeacherAdminData): boolean {
  return Boolean(
    adminData.nationalId?.trim() ||
      adminData.dateOfBirth?.trim() ||
      adminData.gender ||
      adminData.address?.trim() ||
      adminData.timezone?.trim() ||
      adminData.status
  );
}

export function TeacherProfileView({
  teacherData,
  avatarUrl,
  displayCurrency,
  isAdminScope,
  targetUserId,
  meetingTabHref,
}: {
  readonly teacherData: TeacherViewData;
  readonly avatarUrl?: string | null;
  readonly displayCurrency: CurrencyCode | null | undefined;
  readonly isAdminScope: boolean;
  readonly targetUserId?: string;
  readonly meetingTabHref?: string;
}) {
  const t = useTranslations("profile.teacher");
  const scope = isAdminScope ? ProfileScope.Other : ProfileScope.Own;
  const { canView } = useProfileFieldAccess({ scope });
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;

  const renderCompensationSection = () => {
    if (!canView("teacher_professional")) {
      return null;
    }
    if (!hasTeacherProfessionalData(teacherData)) {
      return <ProfileRestrictedSection title={t("sections.compensation")} />;
    }
    return (
      <CompensationSection
        mode="view"
        teacherData={teacherData}
        subjectUserId={isAdminScope ? targetUserId : undefined}
      />
    );
  };

  const renderAdminOnlySection = () => {
    if (!isAdminScope || !adminData || !canView("teacher_identity")) {
      return null;
    }
    if (!hasTeacherIdentityData(adminData)) {
      return <ProfileRestrictedSection title={t("sections.adminOnly")} />;
    }
    return <AdminOnlySection mode="view" adminData={adminData} />;
  };

  const renderStatsSection = () => {
    if (!canView("teacher_professional")) {
      return null;
    }
    if (teacherData.totalClasses == null && !(isAdminScope && adminData?.avgEngagementScore != null)) {
      return <ProfileRestrictedSection title={t("sections.stats")} />;
    }
    return <StatsSection teacherData={teacherData} isAdminScope={isAdminScope} />;
  };

  return (
    <Stack spacing={3}>
      {isAdminScope ? (
        <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
          {t("adminBanner")}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <AccountSection
          mode="view"
          scope={scope}
          teacherData={teacherData}
          avatarUrl={avatarUrl}
          displayCurrency={displayCurrency}
        />
        <ContactSection mode="view" teacherData={teacherData} isAdminScope={isAdminScope} />
        {renderCompensationSection()}
        {renderAdminOnlySection()}
        {targetUserId ? <MeetingSummarySection userId={targetUserId} meetingTabHref={meetingTabHref} /> : null}
      </Box>

      {renderStatsSection()}
    </Stack>
  );
}
