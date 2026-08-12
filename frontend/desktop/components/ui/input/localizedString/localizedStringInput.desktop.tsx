"use client";

import { LocalizedStringInputShared } from "@/frontend/common/components/ui/input/localizedString/localizedStringInputShared";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { LocaleAdornmentSwitchDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localeAdornmentSwitch.desktop";
import { LocalizedStringDrawerDesktop } from "@/frontend/desktop/components/ui/input/localizedString/localizedStringDrawer.desktop";

export const LocalizedStringInputDesktop: React.FC<LocalizedStringInputProps> = props => (
  <LocalizedStringInputShared
    {...props}
    LocaleAdornmentSwitch={LocaleAdornmentSwitchDesktop}
    LocalizedStringDrawer={LocalizedStringDrawerDesktop}
  />
);
