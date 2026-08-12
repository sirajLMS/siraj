"use client";

import { LocaleAdornmentSwitch } from "@/frontend/common/components/ui/input/localizedString/LocaleAdornmentSwitch";
import { LocalizedStringDrawer } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
import { LocalizedStringInputShared } from "@/frontend/common/components/ui/input/localizedString/localizedStringInputShared";
import type { LocalizedStringInputProps } from "@/frontend/common/components/ui/input/localizedString/types";

/**
 * Inline single-locale editor for a JSONB `LocalizedString` map.
 *
 * The component edits one `AppLocale` at a time (the *active editing locale*,
 * default `useLocale()`). The start adornment (`LocaleAdornmentSwitch`)
 * shows the active locale's flag + display name and, on click, commits the
 * current value before swapping to another locale — adds a 500ms green
 * success tint when the committed value passed validation. The end adornment
 * is a `TextButton` "Edit translations" that opens the full
 * `LocalizedStringDrawer` listing one `TextField` per `ALLOWED_LOCALES`.
 *
 * Locales are sourced from `@/shared/i18n/routing`; there is no
 * "Add translation" button. To add a locale, update `routing.locales` +
 * `backend/enum/auth.enum.ts` (`AppLanguage`) +
 * `frontend/lib/locale/language/languages.ts`.
 */
export const LocalizedStringInput: React.FC<LocalizedStringInputProps> = props => (
  <LocalizedStringInputShared
    {...props}
    LocaleAdornmentSwitch={LocaleAdornmentSwitch}
    LocalizedStringDrawer={LocalizedStringDrawer}
  />
);
