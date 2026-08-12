"use client";

import type { PolicyOverviewCardSharedOptions } from "@/frontend/common/views/dashboard/students/status/components/__shared__/policyOverviewCardShared";
import {
  PolicyOverviewCardShared,
  SuspensionWarningBannerShared,
} from "@/frontend/common/views/dashboard/students/status/components/__shared__/policyOverviewCardShared";

const MOBILE_OPTIONS: PolicyOverviewCardSharedOptions = {
  headerSx: theme => ({
    px: 2.5,
    py: 2,
    borderBottom: `1px solid ${theme.palette.border.main}`,
    display: "flex",
    alignItems: "center",
    gap: 1,
    backgroundColor: theme.palette.background.default,
  }),
  gavelSx: theme => ({ color: theme.palette.primary.main, fontSize: 20 }),
  titleTypography: {
    variant: undefined,
    sx: theme => ({
      typography: "titleMd",
      color: theme.palette.primary.main,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }),
  },
  contentSx: { p: 2.5, position: "relative" },
  infoIconFontSize: 100,
  contentGap: 2.5,
  bannerPadding: 2.5,
  bannerGap: 2,
  bannerIconPadding: 1.25,
  bannerIconFontSize: 28,
};

export function PolicyOverviewCardMobile() {
  return <PolicyOverviewCardShared options={MOBILE_OPTIONS} />;
}

export function SuspensionWarningBannerMobile() {
  return <SuspensionWarningBannerShared options={MOBILE_OPTIONS} />;
}
