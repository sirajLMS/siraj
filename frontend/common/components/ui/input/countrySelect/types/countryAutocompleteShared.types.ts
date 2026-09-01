import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { CountryOptionRowProps } from "@/frontend/common/components/ui/input/countrySelect/countryOptionRow.types";

/** Emoji component injected into the autocomplete input adornment. */
type LocaleEmojiSlot = React.ComponentType<{
  readonly emoji: string;
  readonly sx?: SxProps<Theme>;
}>;

/** Option row component injected into the autocomplete dropdown. */
type CountryOptionRowSlot = React.ComponentType<Readonly<CountryOptionRowProps>>;

export interface CountryAutocompleteSlots {
  /** Emoji display component (tier-specific: `LocaleEmoji`, `DesktopLocaleEmoji`, `MobileLocaleEmoji`). */
  readonly LocaleEmoji: LocaleEmojiSlot;
  /** Option row component (tier-specific: `CountryOptionRow`, `CountryOptionRowDesktop`, `CountryOptionRowMobile`). */
  readonly CountryOptionRow: CountryOptionRowSlot;
  /** sx prop applied to the option `<li>` wrapper Box. Mobile uses larger touch targets. */
  readonly optionBoxSx: SxProps<Theme>;
}
