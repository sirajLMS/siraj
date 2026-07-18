"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { LocalizedStringDrawerProps } from "@/frontend/common/components/ui/input/localizedString/types";

const lazyViews = createLazyView<LocalizedStringDrawerProps>(
  () =>
    import("@/frontend/mobile/components/ui/input/localizedString/localizedStringDrawer.mobile").then(m => ({
      default: m.LocalizedStringDrawerMobile,
    })),
  () =>
    import("@/frontend/desktop/components/ui/input/localizedString/localizedStringDrawer.desktop").then(m => ({
      default: m.LocalizedStringDrawerDesktop,
    }))
);

/**
 * Switcher for the localized-string drawer. Reads the viewport tier and
 * delegates to either {@link LocalizedStringDrawerMobile} (bottom sheet)
 * or {@link LocalizedStringDrawerDesktop} (right-anchored drawer). Both
 * tier variants accept the same {@link LocalizedStringDrawerProps}.
 *
 * Right-anchored Drawer that renders one `TextField` per `ALLOWED_LOCALES`
 * (`ar`, `en` today) for full multi-locale editing of a JSONB
 * `LocalizedString` map.
 *
 * Locales are sourced exclusively from `@/shared/i18n/routing`. To add a
 * locale, update `routing.locales` + `backend/enum/auth.enum.ts`
 * (`AppLanguage`) + `frontend/lib/locale/language/languages.ts`; this drawer
 * renders the new locale automatically — no Add-translation button.
 *
 * `Save` is disabled while `hasRequiredLocalizedValue(draft, requiredLocales)`
 * is false. `Cancel` reverts the draft to the prop `value`.
 *
 * `autosave` commits each edit via `onSaveAction` immediately (footer hidden
 * by default). `showActions` controls the Cancel/Save footer explicitly.
 *
 * Dismiss (backdrop, Escape, header ×) defaults to `dismissAction="save"`:
 * commits the draft when valid, then closes. Set `dismissAction="cancel"` to
 * discard on dismiss. The footer Cancel button always discards.
 */
export const LocalizedStringDrawer: React.FC<LocalizedStringDrawerProps> = props => (
  <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />
);
