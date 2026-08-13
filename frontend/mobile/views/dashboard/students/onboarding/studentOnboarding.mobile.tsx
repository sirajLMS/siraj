"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import {
  StudentOnboardingFormBodyShared,
  type StudentOnboardingSharedOptions,
} from "@/frontend/common/views/dashboard/students/onboarding/__shared__/studentOnboardingShared";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import {
  MobileContentStack,
  MobileFormSuccessSnackbar,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { ParentAssignmentSection } from "@/frontend/mobile/views/dashboard/students/onboarding/components/parentAssignmentSection.mobile";
import { TeacherAssignmentSection } from "@/frontend/mobile/views/dashboard/students/onboarding/components/teacherAssignmentSection.mobile";

const MOBILE_OPTIONS: StudentOnboardingSharedOptions = {
  SectionPanel: MobileSectionPanel,
  ParentAssignmentSection,
  TeacherAssignmentSection,
  PrimaryPageAction: MobilePrimaryPageAction,
  buttonSx: { py: 2 },
  buttonFullWidth: true,
  footerPadding: 2,
};

export function StudentOnboardingMobileView({
  labels,
  successOpen,
  onCloseSuccess,
  successMessage,
  ...formProps
}: Readonly<StudentOnboardingViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={4}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={theme => ({
            alignItems: "center",
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            px: 1.5,
            py: 1,
            borderRadius: 2,
          })}
        >
          <InfoOutlined fontSize="small" />
          <Typography variant="labelMd">{labels.statusBanner}</Typography>
        </Stack>

        <StudentOnboardingFormBodyShared {...formProps} labels={labels} options={MOBILE_OPTIONS} />
      </MobileContentStack>

      <MobileFormSuccessSnackbar open={successOpen} message={successMessage} onClose={onCloseSuccess} />
    </MobilePageContainer>
  );
}
