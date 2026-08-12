"use client";

import { LocalizedStringInputShared } from "@/frontend/common/components/ui/input/localizedString/localizedStringInputShared";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";
import { LocaleAdornmentSwitchMobile } from "@/frontend/mobile/components/ui/input/localizedString/localeAdornmentSwitch.mobile";
import { LocalizedStringDrawerMobile } from "@/frontend/mobile/components/ui/input/localizedString/localizedStringDrawer.mobile";

export const LocalizedStringInputMobile: React.FC<LocalizedStringInputProps> = props => (
  <LocalizedStringInputShared
    {...props}
    textFieldSize="small"
    LocaleAdornmentSwitch={LocaleAdornmentSwitchMobile}
    LocalizedStringDrawer={LocalizedStringDrawerMobile}
  />
);
