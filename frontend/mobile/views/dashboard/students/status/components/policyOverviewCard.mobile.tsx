"use client";

import {
  PolicyOverviewCardShared,
  type PolicyOverviewCardSharedOptions,
  SuspensionWarningBannerShared,
} from "@/frontend/common/views/dashboard/students/status/components/__shared__/policyOverviewCardShared";

const MOBILE_OPTIONS: PolicyOverviewCardSharedOptions = {
  headerPx: 2.5,
  headerPy: 2,
  headerGap: 1,
  bodyPadding: 2.5,
  iconSx: theme => ({ color: theme.palette.primary.main, fontSize: 20 }),
  titleSx: theme => ({
    typography: "titleLg",
    color: theme.palette.primary.main,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }),
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
