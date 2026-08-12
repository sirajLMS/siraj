"use client";

import type * as React from "react";
import { CountryDisplayShared } from "@/frontend/common/components/ui/display/countryDisplay/countryDisplayShared";
import type { CountryDisplayProps } from "@/frontend/common/components/ui/display/countryDisplay/types/countryDisplay.types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";

export const DesktopCountryDisplay = ({
  typographyVariant = "bodyMd",
  ...props
}: CountryDisplayProps): React.JSX.Element | null => (
  <CountryDisplayShared
    {...props}
    typographyVariant={typographyVariant}
    LocaleEmoji={DesktopLocaleEmoji}
    flexWrap="nowrap"
    defaultTypographyVariant="bodyMd"
  />
);
