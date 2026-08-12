"use client";

import type * as React from "react";
import { CountryDisplayShared } from "@/frontend/common/components/ui/display/countryDisplay/countryDisplayShared";
import type { CountryDisplayProps } from "@/frontend/common/components/ui/display/countryDisplay/types/countryDisplay.types";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";

export const CountryDisplay = (props: CountryDisplayProps): React.JSX.Element | null => (
  <CountryDisplayShared {...props} LocaleEmoji={LocaleEmoji} />
);
