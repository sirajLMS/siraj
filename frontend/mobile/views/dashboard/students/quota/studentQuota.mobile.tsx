"use client";

import { EditOutlined } from "@mui/icons-material";
import { Box, IconButton, type Theme, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared";
import type { StudentQuotaTierConfig } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.types";
import { wrapContextualHelperCardsDefault } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaSharedUtils";
import type {
  MobileProfileHeaderProps,
  StudentProfileData,
} from "@/frontend/common/views/dashboard/students/quota/types";
import type { StudentQuotaViewModel } from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";
import { MobilePageHeader } from "@/frontend/mobile/components/ui/container/page/MobilePageHeader";
import { ContextualHelperCardsMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile";
import { CourseDetailsSectionMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/courseDetailsSection.mobile";
import { StudentInformationSectionMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/studentInformationSection.mobile";

function MobileProfileHeader({ studentData, onEditAvatar, showAvatarEdit }: Readonly<MobileProfileHeaderProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
      <Box sx={{ position: "relative", width: 96, height: 96, mb: 2 }}>
        <MobileUserAvatar
          src={studentData.profileImage}
          label={studentData.studentName}
          size={96}
          sx={(theme: Theme) => ({
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: theme.palette.shadow.card,
          })}
        />
        {showAvatarEdit ? (
          <IconButton
            onClick={onEditAvatar}
            sx={(theme: Theme) => ({
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.onPrimary,
              p: 0.75,
              border: `2px solid ${theme.palette.background.paper}`,
              "&:hover": { backgroundColor: theme.palette.primary.dark },
            })}
          >
            <EditOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Box>
      <Typography variant="titleLg" sx={(theme: Theme) => ({ color: theme.palette.primary.main })}>
        {studentData.studentName}
      </Typography>
    </Box>
  );
}

function renderMobileHeader({
  t,
  studentData,
}: Readonly<{
  t: { readonly breadcrumbs: { readonly students: string; readonly adjustQuota: string } };
  readonly studentData: StudentProfileData;
}>): ReactElement {
  return (
    <>
      <MobilePageHeader
        title={t.breadcrumbs.adjustQuota}
        breadcrumbs={[
          { label: t.breadcrumbs.students, href: "/students" },
          { label: t.breadcrumbs.adjustQuota, current: true },
        ]}
      />
      <MobileProfileHeader studentData={studentData} showAvatarEdit={false} onEditAvatar={undefined} />
    </>
  );
}

const MOBILE_TIER: StudentQuotaTierConfig = {
  PrimaryAction: MobilePrimaryPageAction,
  sections: {
    StudentInformationSection: StudentInformationSectionMobile,
    CourseDetailsSection: CourseDetailsSectionMobile,
    ContextualHelperCards: ContextualHelperCardsMobile,
  },
  renderHeader: renderMobileHeader,
  cardSx: {
    useCardStyling: false,
    formPadding: 0,
    formGap: 4,
  },
  actionsSx: {
    containerPaddingTop: 3,
    containerDirection: "column",
    innerDirection: "column",
    innerGap: 1.5,
    innerWidth: "100%",
  },
  wrapContextualHelperCards: wrapContextualHelperCardsDefault,
};

export function StudentQuotaMobileView(props: Readonly<StudentQuotaViewModel>) {
  return <StudentQuotaView props={props} tier={MOBILE_TIER} PageContainer={MobilePageContainer} />;
}
