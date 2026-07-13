"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import type { AppLocale, LocalizedString } from "@/frontend/common/types/localized-string.types";

export type LocalizedStringDrawerProps = {
  readonly open: boolean;
  readonly value: LocalizedString;
  readonly title?: string;
  readonly multiline?: boolean;
  readonly minRows?: number;
  readonly required?: boolean;
  readonly requiredLocales?: readonly AppLocale[];
  readonly onSaveAction: (next: LocalizedString) => void;
  readonly onCancelAction: () => void;
  /** Disable Save while parent is performing a save mutation. */
  readonly saving?: boolean;
  /**
   * When `true`, each field edit commits to `onSaveAction` immediately.
   * The footer is hidden unless `showActions` is explicitly `true`.
   */
  readonly autosave?: boolean;
  /**
   * Render Cancel/Save in the drawer footer.
   * Defaults to `!autosave` (footer shown when not autosaving).
   */
  readonly showActions?: boolean;
  /**
   * What happens when the user dismisses via backdrop, Escape, or the header ×.
   * `save` (default): commit the draft when valid, then close.
   * `cancel`: close without saving (discard draft).
   */
  readonly dismissAction?: "save" | "cancel";
  /** Override anchor side; defaults to `right` (desktop only — mobile always anchors bottom). */
  readonly anchor?: "right" | "left" | "top" | "bottom";
};

const lazyViews = createLazyView<LocalizedStringDrawerProps>(
  () =>
    import("@/frontend/components/ui/input/localizedString/localizedStringDrawer.mobile").then(m => ({
      default: m.LocalizedStringDrawerMobile,
    })),
  () =>
    import("@/frontend/components/ui/input/localizedString/localizedStringDrawer.desktop").then(m => ({
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
