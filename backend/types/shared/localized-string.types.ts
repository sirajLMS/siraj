/**
 * Re-export of the canonical `LocalizedString` definitions from `@/shared/types/localized-string`.
 *
 * The canonical home is `shared/` so frontend code can also import these
 * symbols without crossing the `no-restricted-imports` boundary that
 * forbids `@/backend/**` from `frontend/**`. Backend consumers should keep
 * importing from this file (`@/backend/types/shared/localized-string.types`)
 * for backwards compatibility — new code can import directly from
 * `@/shared/types/localized-string`.
 */
export {
  DEFAULT_CONTENT_LOCALE,
  isAppLocale,
  normalizeContentLocale,
} from "@/shared/types/localized-string";
