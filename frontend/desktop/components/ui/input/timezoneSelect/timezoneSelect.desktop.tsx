"use client";

import type * as React from "react";
import { TimezoneSelectShared } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelectShared";
import type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/types/timezoneSelectShared.types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";

export type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/types/timezoneSelectShared.types";

const DESKTOP_OPTION_ROW_SX = { py: 1 } as const;

export const TimezoneSelectDesktop: React.FC<TimezoneSelectProps> = (
  props: Readonly<TimezoneSelectProps>
): React.ReactNode => {
  return (
    <TimezoneSelectShared {...props} LocaleEmojiComponent={DesktopLocaleEmoji} optionRowSx={DESKTOP_OPTION_ROW_SX} />
  );
};
