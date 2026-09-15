"use client";

import {
  PolicyOverviewCardShared,
  type PolicyOverviewCardSharedOptions,
  SuspensionWarningBannerShared,
} from "@/frontend/common/views/dashboard/students/status/components/__shared__/policyOverviewCardShared";

const DESKTOP_OPTIONS: PolicyOverviewCardSharedOptions = {
  headerPx: 3,
  headerPy: 2.5,
  headerGap: 1.5,
  bodyPadding: 3,
  iconSx: theme => ({ color: theme.palette.primary.main }),
  titleSx: theme => ({
    typography: "titleLg",
    color: theme.palette.primary.main,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }),
  infoIconFontSize: 120,
  contentGap: 3,
  bannerPadding: 3,
  bannerGap: 2.5,
  bannerIconPadding: 1.5,
  bannerIconFontSize: 32,
};

export function PolicyOverviewCardDesktop() {
  return <PolicyOverviewCardShared options={DESKTOP_OPTIONS} />;
}

export function SuspensionWarningBannerDesktop() {
  return <SuspensionWarningBannerShared options={DESKTOP_OPTIONS} />;
}
