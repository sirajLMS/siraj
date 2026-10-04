import type { SxProps, Theme } from "@mui/material/styles";

export type LocaleEmojiComponentProps = {
  readonly emoji: string;
  readonly sx?: SxProps<Theme>;
};

export type LocalizedStringDrawerSlotProps = {
  readonly LocaleEmoji: React.ComponentType<LocaleEmojiComponentProps>;
  readonly paperSx: SxProps<Theme>;
  readonly anchor: "right" | "left" | "top" | "bottom";
  readonly footerButtonSx?: SxProps<Theme>;
};
