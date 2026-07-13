"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { AppLocale } from "@/shared/i18n/routing";

export type LocaleAdornmentSwitchProps = {
  readonly activeLocale: AppLocale;
  readonly onChangeAction: (nextLocale: AppLocale) => void;
  /** Disable the switcher button (e.g. when the parent input is disabled). */
  readonly disabled?: boolean;
  /** Render variant: `adornment` for inline `TextField` start adornment, `standalone` for previews/Storybook. */
  readonly variant?: "adornment" | "standalone";
  /**
   * Compact layout for narrow viewports (`down("sm")`): flag + chevron only,
   * language name hidden. Parent sets this from `useMediaQuery`; not part of
   * the public form-field API.
   */
  readonly compact?: boolean;
  /** Visually indicate a successful commit immediately after switching (500ms green tint). */
  readonly successSwitch?: boolean;
  /** Optional aria label override; defaults to translated `selectLocale`. */
  readonly ariaLabel?: string;
};

const lazyViews = createLazyView<LocaleAdornmentSwitchProps>(
  () =>
    import("@/frontend/mobile/components/ui/input/localizedString/localeAdornmentSwitch.mobile").then(m => ({
      default: m.LocaleAdornmentSwitchMobile,
    })),
  () =>
    import("@/frontend/desktop/components/ui/input/localizedString/localeAdornmentSwitch.desktop").then(m => ({
      default: m.LocaleAdornmentSwitchDesktop,
    }))
);

/**
 * Reusable start-adornment switcher for the localized-string inline input.
 *
 * Renders the active locale's flag (`LocaleEmoji`) + the language display
 * name in the UI locale. Clicking opens a small Popover listing every
 * `LanguageType` from `@/frontend/lib/locale` (mirrors the navbar
 * `LanguageSwitcher` pattern). Selecting a locale calls `onChangeAction`
 * — the parent is responsible for committing the draft before swapping.
 *
 * Adding a locale requires updating `routing.locales` +
 * `backend/enum/auth.enum.ts` (`AppLanguage`) +
 * `frontend/lib/locale/language/languages.ts`; this adornment then lists it
 * automatically.
 *
 * This file is the viewport-aware switcher — it lazy-loads
 * `LocaleAdornmentSwitchMobile` or `LocaleAdornmentSwitchDesktop` via
 * `ResponsiveViewSwitch`. The mobile and desktop variants contain no
 * viewport logic.
 */
export const LocaleAdornmentSwitch: React.FC<LocaleAdornmentSwitchProps> = props => (
  <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />
);
