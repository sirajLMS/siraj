"use client";

import type { PolicyOverviewCardSharedOptions } from "@/frontend/common/views/dashboard/students/status/components/__shared__/policyOverviewCardShared";
import {
  PolicyOverviewCardShared,
  SuspensionWarningBannerShared,
} from "@/frontend/common/views/dashboard/students/status/components/__shared__/policyOverviewCardShared";

const DESKTOP_OPTIONS: PolicyOverviewCardSharedOptions = {
  headerSx: theme => ({
    px: 3,
    py: 2.5,
    borderBottom: `1px solid ${theme.palette.border.main}`,
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    backgroundColor: theme.palette.background.default,
  }),
  gavelSx: theme => ({ color: theme.palette.primary.main }),
  titleTypography: {
    variant: "titleLg",
    sx: theme => ({
      color: theme.palette.primary.main,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }),
  },
  contentSx: { p: 3, position: "relative" },
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
