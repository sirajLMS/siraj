"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import { LocalizedStringDrawerShared } from "@/frontend/common/components/ui/input/localizedString/localizedStringDrawerShared";
import type { LocalizedStringDrawerProps } from "@/frontend/common/components/ui/input/localizedString/types/localizedStringDrawer.types";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji/localeEmoji.desktop";

const desktopPaperSx: SxProps<Theme> = {
  width: { xs: "100%", sm: 480 },
  maxHeight: "100%",
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  display: "flex",
  flexDirection: "column",
};

export const LocalizedStringDrawerDesktop: React.FC<LocalizedStringDrawerProps> = ({ anchor = "right", ...props }) => (
  <LocalizedStringDrawerShared {...props} anchor={anchor} LocaleEmoji={DesktopLocaleEmoji} paperSx={desktopPaperSx} />
);
