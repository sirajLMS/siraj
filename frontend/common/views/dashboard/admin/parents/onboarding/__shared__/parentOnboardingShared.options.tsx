import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { ParentOnboardingSharedOptions } from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared";
import {
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

const createStatusBadgeSx = (gap: number, px: number, py: number) => (theme: Theme) => ({
  display: "flex",
  flexDirection: "row",
  gap,
  alignItems: "center",
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  px,
  py,
  borderRadius: 2,
});

const renderFormSections = (sections: ReactNode, meetingConfigSection: ReactNode) => (
  <>
    {sections}
    {meetingConfigSection}
  </>
);

export const DESKTOP_OPTIONS: ParentOnboardingSharedOptions = {
  formGap: 3,
  formSx: { display: "flex", flexDirection: "column", gap: 3 },
  alertSx: { mb: 2 },
  statusBadgeSx: createStatusBadgeSx(2, 2, 1),
  statusBadgeIconSize: 24,
  statusBadgeTypographyVariant: "labelMd",
  submitBoxSx: theme => ({
    p: 3,
    backgroundColor: theme.palette.surfaceContainerLow,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: { xs: "column", sm: "row" },
    gap: 2,
  }),
  submitButtonSx: { px: 6, py: 2, fontWeight: 700, letterSpacing: "0.1em", minWidth: 200 },
  renderPageContainer: children => <DesktopPageContainer>{children}</DesktopPageContainer>,
  renderPageHeader: (title, subtitle, actions) => (
    <DesktopPageHeader title={title} subtitle={subtitle} actions={actions} />
  ),
  renderSectionPanel: (title, children) => <DesktopSectionPanel title={title}>{children}</DesktopSectionPanel>,
  renderSubmitButton: ({ isSubmitting, processingLabel, signupLabel }) => (
    <DesktopPrimaryPageAction type="submit" disabled={isSubmitting}>
      {isSubmitting ? processingLabel : signupLabel}
    </DesktopPrimaryPageAction>
  ),
  renderSuccessSnackbar: (open, message, onClose) => (
    <FormSuccessSnackbar open={open} message={message} onClose={onClose} />
  ),
  renderFormSections,
};

export const MOBILE_OPTIONS: ParentOnboardingSharedOptions = {
  formGap: 2,
  formSx: { display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, md: 3 }, pb: 4 },
  alertSx: { mx: 2, mt: 1 },
  statusBadgeSx: createStatusBadgeSx(1, 1.5, 0.5),
  statusBadgeIconSize: 18,
  statusBadgeTypographyVariant: "labelSm",
  submitBoxSx: theme => ({
    p: 2,
    backgroundColor: theme.palette.surfaceContainerLow,
    borderRadius: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 2,
  }),
  submitButtonSx: { py: 2, fontWeight: 700, letterSpacing: "0.1em" },
  renderPageContainer: children => <MobilePageContainer>{children}</MobilePageContainer>,
  renderPageHeader: (title, subtitle, actions) => (
    <MobilePageHeader title={title} subtitle={subtitle} edgeToEdge={false} actions={actions} />
  ),
  renderSectionPanel: (title, children) => <MobileSectionPanel title={title}>{children}</MobileSectionPanel>,
  renderSubmitButton: ({ isSubmitting, processingLabel, signupLabel }) => (
    <MobilePrimaryPageAction type="submit" disabled={isSubmitting} fullWidth>
      {isSubmitting ? processingLabel : signupLabel}
    </MobilePrimaryPageAction>
  ),
  renderSuccessSnackbar: (open, message, onClose) => (
    <FormSuccessSnackbar open={open} message={message} onClose={onClose} />
  ),
  renderFormSections,
};
