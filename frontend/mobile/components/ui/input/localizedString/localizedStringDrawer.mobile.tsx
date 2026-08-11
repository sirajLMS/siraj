"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import { LocalizedStringDrawerShared } from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared";
import type { LocalizedStringDrawerProps } from "@/frontend/common/components/ui/input/localizedString/types/localizedStringDrawer.types";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji/localeEmoji.mobile";

const mobilePaperSx: SxProps<Theme> = {
  width: "100%",
  maxHeight: "85vh",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  display: "flex",
  flexDirection: "column",
};

const mobileFooterButtonSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 48,
};

export const LocalizedStringDrawerMobile: React.FC<LocalizedStringDrawerProps> = props => (
  <LocalizedStringDrawerShared
    {...props}
    anchor="bottom"
    LocaleEmoji={MobileLocaleEmoji}
    paperSx={mobilePaperSx}
    footerButtonSx={mobileFooterButtonSx}
  />
);
