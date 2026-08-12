// cspell:disable
"use client";

import {
  AvailabilityInsightsShared,
  type AvailabilityInsightsSharedOptions,
} from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared";
import { MOBILE_AVAILABILITY_INSIGHTS_STYLE_OPTIONS } from "@/frontend/common/views/dashboard/teachers/availability/components/__shared__/availabilityInsightsShared.options";
import type { AvailabilityInsightsProps } from "@/frontend/common/views/dashboard/teachers/availability/types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobileTimezoneDisplay } from "@/frontend/mobile/components/ui/display/timezoneDisplay";

export function AvailabilityInsightsMobile(props: Readonly<AvailabilityInsightsProps>) {
  const options: AvailabilityInsightsSharedOptions = {
    ...MOBILE_AVAILABILITY_INSIGHTS_STYLE_OPTIONS,
    CardComponent: MobileBaseCard,
    AvatarComponent: MobileUserAvatar,
    TimezoneDisplayComponent: MobileTimezoneDisplay,
  };

  return <AvailabilityInsightsShared {...props} options={options} />;
}
