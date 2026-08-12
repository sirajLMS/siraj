"use client";

import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import { TimezoneSelectShared } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelectShared";
import type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/types/timezoneSelectShared.types";

export type { TimezoneSelectProps } from "@/frontend/common/components/ui/input/timezoneSelect/types/timezoneSelectShared.types";

/**
 * Viewport-agnostic timezone select. Uses the shared `LocaleEmoji` from the
 * common display layer. Tier-specific variants (`TimezoneSelectDesktop`,
 * `TimezoneSelectMobile`) inject their own emoji component and option row
 * sizing.
 */
export const TimezoneSelect: React.FC<TimezoneSelectProps> = (
  props: Readonly<TimezoneSelectProps>
): React.ReactNode => {
  return <TimezoneSelectShared {...props} LocaleEmojiComponent={LocaleEmoji} />;
};
