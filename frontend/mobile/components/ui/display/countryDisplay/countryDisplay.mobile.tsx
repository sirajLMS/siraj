"use client";

import type * as React from "react";
import { CountryDisplayShared } from "@/frontend/common/components/ui/display/countryDisplay/countryDisplayShared";
import type { CountryDisplayProps } from "@/frontend/common/components/ui/display/countryDisplay/types/countryDisplay.types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

export const MobileCountryDisplay = ({
  typographyVariant = "caption",
  ...props
}: CountryDisplayProps): React.JSX.Element | null => (
  <CountryDisplayShared
    {...props}
    typographyVariant={typographyVariant}
    LocaleEmoji={MobileLocaleEmoji}
    spacing={0.5}
    flexWrap="nowrap"
    defaultTypographyVariant="caption"
  />
);
