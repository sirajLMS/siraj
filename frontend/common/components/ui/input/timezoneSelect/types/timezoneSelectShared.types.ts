import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export type TimezoneSelectProps = {
  readonly value: IanaTimezone | null;
  readonly onChangeAction: (timezone: IanaTimezone | null) => void;
  readonly onBlurAction?: () => void;
  readonly label?: string;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  readonly autoComplete?: string;
  readonly style?: React.CSSProperties;
  readonly error?: boolean;
  readonly helperText?: string;
};

/** Component used to render the flag emoji in the input start adornment and option rows. */
export type LocaleEmojiComponent = React.FC<{ readonly emoji: string }>;

interface TimezoneSelectSlotProps {
  /** Component used to render the flag emoji in the input and dropdown options */
  readonly LocaleEmojiComponent: LocaleEmojiComponent;
  /** sx applied to each option row <Box component="li"> (mobile uses larger touch targets) */
  readonly optionRowSx?: SxProps<Theme>;
}

export type TimezoneSelectSharedProps = TimezoneSelectProps & TimezoneSelectSlotProps;
