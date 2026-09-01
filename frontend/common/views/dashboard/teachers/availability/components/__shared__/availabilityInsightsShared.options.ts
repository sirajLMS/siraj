import type { SxProps, Theme } from "@mui/material/styles";

import type { AvailabilityInsightsSharedStyleOptions } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared";

const desktopLayoutSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
  gap: 3,
  mt: 4,
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
