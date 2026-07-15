/**
 * CommonLabels — compile-time safe type schema for the "common" namespace.
 * Migrated from shared/messages/types/common/index.ts (next-intl format).
 *
 * All fields that used {placeholder} ICU placeholders in next-intl are now
 * typed as functions. Fields with no placeholders remain plain strings.
 *
 * This namespace currently has no interpolation or pluralization needs,
 * so all fields remain as plain strings.
 */
export interface CommonLabels {
  readonly title: string;
  readonly description: string;
  readonly documentTitleTemplate: (title: string) => string;
  readonly welcome: string;
  readonly subtitle: string;
  readonly toggleTheme: string;
  readonly languageSwitcher: string;
  readonly langAr: string;
  readonly langEn: string;
  readonly langArShort: string;
  readonly langEnShort: string;
  readonly themeDark: string;
  readonly themeLight: string;
  readonly activeTheme: string;
  readonly themeTooltip: string;
  readonly languageTooltip: string;
  readonly notifications: string;
  readonly serverConnectionLost: string;
  readonly retry: string;
  readonly checkNetworkConnection: string;
  readonly connectionRestored: string;
  readonly somethingWentWrong: string;
  readonly operationFailed: string;
  readonly loadFailed: string;
  readonly loading: string;
  readonly notSet: string;
  readonly errors: string;
  readonly cancel: string;
  readonly save: string;
}
