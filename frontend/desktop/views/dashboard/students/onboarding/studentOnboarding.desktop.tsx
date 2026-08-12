"use client";

import { Stack, Typography } from "@mui/material";
import type { StudentOnboardingSharedOptions } from "@/frontend/common/views/dashboard/students/onboarding/__shared__/studentOnboardingShared";
import { StudentOnboardingFormBodyShared } from "@/frontend/common/views/dashboard/students/onboarding/__shared__/studentOnboardingShared";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import { DesktopFormSuccessSnackbar, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ParentAssignmentSection } from "@/frontend/desktop/views/dashboard/students/onboarding/components/parentAssignmentSection.desktop";
import { TeacherAssignmentSection } from "@/frontend/desktop/views/dashboard/students/onboarding/components/teacherAssignmentSection.desktop";

const DESKTOP_OPTIONS: StudentOnboardingSharedOptions = {
  SectionPanel: DesktopSectionPanel,
  ParentAssignmentSection,
  TeacherAssignmentSection,
  PrimaryPageAction: DesktopPrimaryPageAction,
  buttonSx: { px: 6, py: 2, minWidth: 200 },
  buttonFullWidth: undefined,
  footerPadding: 3,
};

export function StudentOnboardingDesktopView({
  labels,
  successOpen,
  onCloseSuccess,
  successMessage,
  ...formProps
}: Readonly<StudentOnboardingViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <Stack
            direction="row"
            spacing={2}
            sx={theme => ({
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
              px: 2,
              py: 1,
              borderRadius: 2,
            })}
          >
            <Typography variant="labelMd">{labels.statusBanner}</Typography>
          </Stack>
        }
      />

      <StudentOnboardingFormBodyShared {...formProps} labels={labels} options={DESKTOP_OPTIONS} />

      <DesktopFormSuccessSnackbar open={successOpen} message={successMessage} onClose={onCloseSuccess} />
    </DesktopPageContainer>
  );
}
