"use client";

import { BaseCard } from "@/frontend/common/components/ui";
import {
  AvailabilityInsightsShared,
  type AvailabilityInsightsSharedOptions,
} from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared";
import { DESKTOP_AVAILABILITY_INSIGHTS_STYLE_OPTIONS } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.options";
import type { AvailabilityInsightsProps } from "@/frontend/common/views/dashboard/teachers/availability/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";
import { DesktopTimezoneDisplay } from "@/frontend/desktop/components/ui/display/timezoneDisplay/timezoneDisplay.desktop";

export function AvailabilityInsightsDesktop(props: Readonly<AvailabilityInsightsProps>) {
  const options: AvailabilityInsightsSharedOptions = {
    ...DESKTOP_AVAILABILITY_INSIGHTS_STYLE_OPTIONS,
    CardComponent: BaseCard,
    AvatarComponent: DesktopUserAvatar,
    TimezoneDisplayComponent: DesktopTimezoneDisplay,
  };

  return <AvailabilityInsightsShared {...props} options={options} />;
}
