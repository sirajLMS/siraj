import { type AppLocale, locales } from "@/shared/locale";

/**
 * Source-of-truth list of locales the localized-string UI may edit.
 * Mirrors `routing.locales` so adding a locale there flows through to every
 * component automatically.
 */
export const ALLOWED_LOCALES: readonly AppLocale[] = locales;
