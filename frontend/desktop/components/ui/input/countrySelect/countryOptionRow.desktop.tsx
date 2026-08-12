"use client";

import type * as React from "react";
import { CountryOptionRow } from "@/frontend/common/components/ui/input/countrySelect/CountryOptionRow";
import type { CountryOptionRowProps } from "@/frontend/common/components/ui/input/countrySelect/countryOptionRow.types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";

export function CountryOptionRowDesktop({
  country,
  locale,
  showPhonePrefix = true,
}: CountryOptionRowProps): React.ReactNode {
  return (
    <CountryOptionRow
      country={country}
      locale={locale}
      showPhonePrefix={showPhonePrefix}
      EmojiComponent={DesktopLocaleEmoji}
    />
  );
}
