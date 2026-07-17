import type { AppLocale } from "@/shared/i18n/routing";

export type LocaleAdornmentSwitchProps = {
  readonly activeLocale: AppLocale;
  readonly onChangeAction: (locale: AppLocale) => void;
  readonly disabled?: boolean;
  readonly variant?: "adornment" | "standalone";
  readonly compact?: boolean;
  readonly successSwitch?: boolean;
  readonly ariaLabel?: string;
};
