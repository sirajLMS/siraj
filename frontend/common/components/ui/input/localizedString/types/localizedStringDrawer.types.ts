// NEW FOR PLAN v5: lifted to common to unify tier-localizedString duplicated type declarations.
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
