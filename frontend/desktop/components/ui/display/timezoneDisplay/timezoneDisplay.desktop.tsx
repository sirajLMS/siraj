"use client";

import type * as React from "react";
import {
  TimezoneDisplay,
  type TimezoneDisplayProps,
} from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";

export type DesktopTimezoneDisplayProps = TimezoneDisplayProps;

const DEFAULT_TYPOGRAPHY_VARIANT = "bodyMd" as const;

/**
 * Desktop-tier timezone display. Delegates to the shared `TimezoneDisplay`
 * with a desktop default `typographyVariant` of `"bodyMd"`.
 */
export const DesktopTimezoneDisplay = ({
  typographyVariant = DEFAULT_TYPOGRAPHY_VARIANT,
  ...props
}: Readonly<DesktopTimezoneDisplayProps>): React.JSX.Element | null => {
  return <TimezoneDisplay {...props} typographyVariant={typographyVariant} />;
};
