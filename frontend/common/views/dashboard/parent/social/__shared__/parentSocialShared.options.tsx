import { Grid, Stack } from "@mui/material";
import type { ParentSocialSharedOptions } from "@/frontend/common/views/dashboard/parent/social/__shared__/parentSocialShared";
import { DesktopPageContainer, DesktopPhoneDisplay, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePhoneDisplay,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

export const DESKTOP_OPTIONS: ParentSocialSharedOptions = {
  typographyVariant: "bodyLg",
  linkSxWidth: false,
  renderPhoneDisplay: (phone, typographyVariant) => (
    <DesktopPhoneDisplay phone={phone} typographyVariant={typographyVariant} />
  ),
  renderPageContainer: children => <DesktopPageContainer>{children}</DesktopPageContainer>,
  renderPageHeader: (title, subtitle) => <DesktopPageHeader title={title} subtitle={subtitle} />,
  renderSectionPanel: (title, children) => <DesktopSectionPanel title={title}>{children}</DesktopSectionPanel>,
  renderSections: (contactPanel, socialPanel) => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>{contactPanel}</Grid>
      <Grid size={{ xs: 12, md: 6 }}>{socialPanel}</Grid>
    </Grid>
  ),
};

export const MOBILE_OPTIONS: ParentSocialSharedOptions = {
  typographyVariant: "bodyMd",
  linkSxWidth: true,
  renderPhoneDisplay: (phone, typographyVariant) => (
    <MobilePhoneDisplay phone={phone} typographyVariant={typographyVariant} />
  ),
  renderPageContainer: children => <MobilePageContainer>{children}</MobilePageContainer>,
  renderPageHeader: (title, subtitle) => <MobilePageHeader title={title} subtitle={subtitle} />,
  renderSectionPanel: (title, children) => <MobileSectionPanel title={title}>{children}</MobileSectionPanel>,
  renderSections: (contactPanel, socialPanel) => (
    <Stack spacing={2}>
      {contactPanel}
      {socialPanel}
    </Stack>
  ),
};
