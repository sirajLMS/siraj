"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { LocaleAdornmentSwitchProps } from "@/frontend/common/components/ui/input/localizedString/types";

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
