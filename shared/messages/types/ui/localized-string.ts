/**
 * LocalizedString UI component shape — i18n labels shared between
 * the inline input, the start-adornment locale switch, and the drawer.
 */
export interface LocalizedStringLabels {
  /** "Edit translations" — end-adornment button + default drawer title. */
  readonly editTranslations: string;
  /** Drawer Cancel button. */
  readonly cancel: string;
  /** Drawer Save button. */
  readonly save: string;
  /** `aria-label` for the start-adornment locale switcher button. */
  readonly selectLocale: string;
  /**
   * Drawer subtitle shown under the title in the drawer header.
   */
  readonly drawerSubtitle: string;
  /**
   * `aria-label` for the start-adornment locale switcher button (fallback
   * when no per-locale tooltip is computed). Kept distinct from
   * `selectLocale` so the inline input and the drawer can both reuse it.
   */
  readonly switchLocale: string;
  /**
   * Helper text shown when `required` is true but no entry is non-empty.
   * Interpolated as `At least one translation is required`.
   */
  readonly atLeastOneTranslationRequired: string;
  /**
   * Helper text shown when exactly one required locale is missing.
   * `{ localeName }` interpolates the locale's display name in the UI locale.
   */
  readonly localeRequired: string;
  /**
   * Helper text shown when more than one required locale is missing.
   * `{ localeNames }` interpolates a comma-separated list of display names.
   */
  readonly localesRequired: string;
  /**
   * Per-field error helper shown inside the drawer / inline input when a
   * single required-locale entry is empty. `{ localeName }` interpolates.
   */
  readonly localeRequiredEntry: string;
}
