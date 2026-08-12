import type { SxProps, Theme } from "@mui/material/styles";

import type { AvailabilityInsightsSharedStyleOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared";

const desktopLayoutSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
  gap: 3,
  mt: 4,
};

const mobileLayoutSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  mt: 3,
};

export const DESKTOP_AVAILABILITY_INSIGHTS_STYLE_OPTIONS: AvailabilityInsightsSharedStyleOptions = {
  cardMinHeight: 160,
  insightTitleMarginBottom: 2,
  valueVariant: "display",
  descriptionVariant: "bodyMd",
  timezoneTitleMarginBottom: 1,
  avatarGroupMarginTop: 2,
  avatarSize: 32,
  iconOffset: 16,
  iconFontSize: 120,
  layoutSx: desktopLayoutSx,
};

export const MOBILE_AVAILABILITY_INSIGHTS_STYLE_OPTIONS: AvailabilityInsightsSharedStyleOptions = {
  cardMinHeight: 130,
  cardFlex: 1,
  insightTitleMarginBottom: 1.5,
  valueVariant: "titleLg",
  descriptionVariant: "labelSm",
  timezoneTitleMarginBottom: 0.5,
  avatarGroupMarginTop: 1.5,
  avatarSize: 28,
  iconOffset: 12,
  iconFontSize: 96,
  layoutSx: mobileLayoutSx,
};
