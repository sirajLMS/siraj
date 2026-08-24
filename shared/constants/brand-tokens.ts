/**
 * Brand token fallbacks for non-styled surfaces (PWA manifest, meta theme, etc).
 *
 * These are ONLY used when the dynamic appearance settings row cannot be
 * resolved (e.g. before DB seeding, during cold-start, or when the appearance
 * service throws). The user-facing UI colors are always driven by the
 * appearance settings row / CSS theme — never by these constants.
 *
 * Keeping them in a single shared module prevents the PWA manifest, the
 * `<meta name="theme-color">` tag, and any other SSR-only consumer from each
 * re-hardcoding the same hex values.
 *
 * Values mirror `DEFAULT_APPEARANCE_FIELDS.colors.dark` in
 * `backend/services/appearance/appearance-settings.service.ts` so that a
 * cold-start manifest matches the dark-mode default the UI ships with.
 */
export const FALLBACK_BG_TOKEN = "#121212";
export const FALLBACK_THEME_TOKEN = "#2DD4BF";
