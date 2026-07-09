import type { AppLocale } from "@/shared/i18n/routing";
import { locales } from "@/shared/i18n/routing";
import type { LocalizedString } from "@/shared/types/localized-string";

export type { AppLocale, LocalizedString };

/**
 * Source-of-truth list of locales the localized-string UI may edit.
 * Mirrors `routing.locales` so adding a locale there flows through to every
 * component automatically.
 */
export const ALLOWED_LOCALES: readonly AppLocale[] = locales;

export type LocalizedStringRow = { readonly locale: AppLocale; readonly text: string };
