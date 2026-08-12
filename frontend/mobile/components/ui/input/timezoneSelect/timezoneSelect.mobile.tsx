"use client";

import type * as React from "react";
import { TimezoneSelectShared } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelectShared";
import type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/types/timezoneSelectShared.types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";

const MOBILE_OPTION_ROW_SX = { py: 1.5, minHeight: 48 } as const;

export const TimezoneSelectMobile: React.FC<TimezoneSelectProps> = (
  props: Readonly<TimezoneSelectProps>
): React.ReactNode => {
  return (
    <TimezoneSelectShared {...props} LocaleEmojiComponent={MobileLocaleEmoji} optionRowSx={MOBILE_OPTION_ROW_SX} />
  );
};
