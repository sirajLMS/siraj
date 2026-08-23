/**
 * Site Appearance Customization — Input Sanitization Helpers (AC-34).
 *
 * Defense-in-depth sanitization for the three free-form input categories
 * that cross the GraphQL → JSONB boundary in
 * {@link AppearanceSettingsService.saveDraft}:
 *
 *  1. **Hex colors** (`colors.{light,dark}.{primaryMain, secondaryMain}`):
 *     {@link normalizeHexColor} lowercases, strips whitespace, and ensures
 *     the canonical `#rrggbb` shape (the Zod schema enforces the same shape
 *     but does not normalize whitespace or case).
 *
 *  2. **Metadata HTML** (`siteDescription` when rendered as a
 *     `<meta name="description">` or OpenGraph tag value):
 *     {@link sanitizeMetadataHtml} runs the input through DOMPurify to strip
 *     `<script>`, `onload=`, `javascript:`, and other XSS vectors. The
 *     result is plain text or a tight subset of inline formatting tags.
 *
 *  3. **Site name / title** (rendered in `<title>`, `og:site_name`):
 *     {@link sanitizeSiteName} strips all HTML tags (these fields are plain
 *     text) and truncates to the schema's `maxLength`.
 *
 * Layer note: lives in `shared/lib/` so both
 * `backend/services/appearance/` (the canonical saveDraft integration
 * point) and any future frontend "Import JSON" customizer flow can call
 * the same sanitization seam without crossing layer boundaries.
 *
 * Used by (AC-34):
 *  - `backend/services/appearance/appearance-settings.service.ts` —
 *    `saveDraft` runs {@link sanitizeAppearanceFields} before the Zod
 *    re-validation so the validator sees already-clean input.
 *  - Task 9.3 "Export JSON" / future "Import JSON" customizer flow.
 *
 * Design decision: normalization + sanitization is layered BEFORE schema
 * validation, so the validator sees already-clean input. This is the
 * "defense in depth" pattern — sanitize early, validate late, persist only
 * validated-and-sanitized payloads. The Zod schema (Task 9.10) is the
 * final guard; this module is the upstream guard.
 */

import { sanitize } from "isomorphic-dompurify";
import { APPEARANCE_HEX_PATTERN } from "@/shared/schemas/appearance.zod";

/**
 * Max length for the `siteName` field after sanitization.
 *
 * Matches the Zod schema `maxLength` for `siteName` (Task 9.10) and the
 * JSON Schema (Task 9.1). Truncating here is a safety net — the GraphQL
 * input type also enforces this length, but a direct service caller
 * (e.g. an env-config override replay) might bypass GraphQL.
 */
export const SITE_NAME_MAX_LENGTH = 80;

/**
 * Max length for the `siteTitle` field after sanitization.
 *
 * `siteTitle` is the full HTML `<title>` text; the schema allows 120 chars.
 */
export const SITE_TITLE_MAX_LENGTH = 120;

/**
 * Max length for the `siteDescription` field after sanitization.
 *
 * Empty is allowed (the SSR `generateMetadata` path treats an empty
 * description as "fall back to default").
 */
export const SITE_DESCRIPTION_MAX_LENGTH = 300;

/**
 * Sentinel returned by {@link normalizeHexColor} when the input cannot be
 * salvaged into a valid 6-digit hex string.
 *
 * `#000000` (pure black) is a safe non-crashing fallback — MUI's
 * `nativeColor` derivation and the WCAG contrast math both handle it
 * without producing NaN or CSS parse errors. The choice is intentional:
 * an invalid color should not silently pass through as the *original*
 * malformed string (which could break CSS var injection downstream), and
 * it should not be `null` (the schema requires a non-null hex string).
 */
export const INVALID_HEX_FALLBACK = "#000000";

/**
 * HTML tag stripper — used by {@link sanitizeSiteName} to coerce to plain
 * text after DOMPurify has already neutralized any nested malformations
 * (e.g. `<scr<script>ipt>`).
 *
 * Pattern rationale: `<[^<>]*>` is strictly linear (no backtracking) and
 * satisfies the `sonarjs/super-linear-regex` rule. The character class
 * `[^<>]*` matches any run of characters that are neither `<` nor `>`, so
 * the regex finds the next `>` without ambiguity — `<a>b<c>` matches as
 * `<a>` then `<c>`, identical to the more common `<[^>]*>` pattern.
 */
const HTML_TAG_PATTERN = /<[^<>]*>/g;

/**
 * Allowlist of inline formatting tags preserved by
 * {@link sanitizeMetadataHtml} when sanitizing `siteDescription`.
 *
 * Metadata contexts (`<meta name="description">`, `og:description`) render
 * as plain text in most consumers (search engines, social previews), so
 * preserving inline formatting tags is harmless — they're stripped by the
 * renderer. We keep a tight allowlist so the sanitized output is auditable;
 * the default DOMPurify config preserves many more tags (`<table>`,
 * `<h1>`, `<div>`, …) which are unnecessary for a description blurb.
 */
const METADATA_ALLOWED_TAGS = ["b", "i", "em", "strong", "a", "p", "br"] as const;

/**
 * Allowlist of attributes preserved by {@link sanitizeMetadataHtml}.
 *
 * DOMPurify's default allowlist includes `class`, `style`, etc.; for
 * metadata HTML we only need `href` on `<a>` tags (and DOMPurify already
 * strips `javascript:` / `data:` URIs from `href` by default).
 */
const METADATA_ALLOWED_ATTR = ["href"] as const;

/**
 * Normalize a hex color input to the canonical `#rrggbb` shape (AC-34).
 *
 * Steps (defense-in-depth — each layer catches a different failure mode):
 *  1. Coerce to string + trim leading/trailing whitespace.
 *  2. Strip any internal whitespace (handles pasted "# ff ff ff" typos).
 *  3. If missing the `#` prefix but the remainder is a valid 6-digit hex,
 *     prepend `#` (handles pasted `0D9488` from a designer's color picker).
 *  4. Lowercase (canonical storage form — `#0d9488`, not `#0D9488`).
 *  5. Validate against {@link APPEARANCE_HEX_PATTERN}. If still invalid,
 *     return {@link INVALID_HEX_FALLBACK} (`#000000`) so the caller never
 *     persists a malformed color string that would break CSS var injection.
 *
 * The result is guaranteed to match the Zod `APPEARANCE_HEX_PATTERN`
 * (`^#[0-9a-fA-F]{6}$`), so {@link zAppearanceFields} validation passes
 * for any input that survives this function.
 *
 * @example
 * normalizeHexColor("#0D9488")      // → "#0d9488"
 * normalizeHexColor("  0D9488 ")    // → "#0d9488"
 * normalizeHexColor("0D9488")       // → "#0d9488"
 * normalizeHexColor("#0D 9488")     // → "#0d9488"
 * normalizeHexColor("not-a-color")  // → "#000000"
 * normalizeHexColor(123)            // → "#000000"
 * normalizeHexColor(null)           // → "#000000"
 */
export function normalizeHexColor(input: unknown): string {
  if (typeof input !== "string") {
    return INVALID_HEX_FALLBACK;
  }
  const trimmed = input.trim().replace(/\s+/g, "");
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const lowercased = withHash.toLowerCase();
  return APPEARANCE_HEX_PATTERN.test(lowercased) ? lowercased : INVALID_HEX_FALLBACK;
}

/**
 * Sanitize a metadata HTML payload by stripping dangerous tags/attributes
 * (AC-34).
 *
 * Uses `isomorphic-dompurify` (declared in `package.json`) — the
 * isomorphic build of DOMPurify that works on both server (Node + jsdom)
 * and browser (native DOMParser). The default config strips:
 *   - `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>` tags.
 *   - All `on*` event-handler attributes (`onload`, `onerror`, …).
 *   - `javascript:` URIs in `href` / `src`.
 *   - `data:` URIs in `href` (which can be used for phishing).
 *
 * For metadata contexts (`<meta name="description">`, OpenGraph tags) the
 * returned value preserves a tight allowlist of inline formatting tags
 * (`<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>`) — safe to
 * render via `dangerouslySetInnerHTML` if a future UI ever needs to.
 * Callers that need a stricter plain-text form should pipe the result
 * through {@link sanitizeSiteName}.
 *
 * The function never throws — on any internal failure (e.g. jsdom
 * unavailable in a stripped-down runtime) it falls back to a regex-based
 * tag strip so the function always returns a string. An empty input
 * returns an empty string (the SSR `generateMetadata` path already treats
 * empty descriptions as "fall back to default").
 *
 * @example
 * sanitizeMetadataHtml("Safe description with <b>bold</b>")
 *   // → "Safe description with <b>bold</b>"
 * sanitizeMetadataHtml('<script>alert(1)</script>clean')
 *   // → "clean"
 * sanitizeMetadataHtml('<a href="javascript:alert(1)">x</a>')
 *   // → "<a>x</a>"
 * sanitizeMetadataHtml(42)   // → ""
 * sanitizeMetadataHtml("")   // → ""
 */
export function sanitizeMetadataHtml(html: unknown): string {
  if (typeof html !== "string" || html.length === 0) {
    return "";
  }
  try {
    return sanitize(html, {
      ALLOWED_TAGS: [...METADATA_ALLOWED_TAGS],
      ALLOWED_ATTR: [...METADATA_ALLOWED_ATTR],
    });
  } catch {
    // DOMPurify should never throw on a string input, but if jsdom is
    // unavailable (e.g. a stripped-down runtime), fall back to a
    // regex-based tag strip so the function never throws.
    return html.replace(HTML_TAG_PATTERN, "");
  }
}

/**
 * Sanitize a plain-text field that will be rendered in an HTML context
 * (e.g. `<title>`, `og:site_name`) — strips ALL HTML tags and truncates
 * to `maxLength` (AC-34).
 *
 * The {@link AppearanceFields} text fields (`siteName`, `siteTitle`) are
 * documented as plain text, but a malicious or copy-paste input could
 * include angle brackets. Stripping tags here ensures no `<script>` can
 * ever reach the SSR `<title>` element via the appearance payload.
 *
 * Truncation slices on `String.length` (UTF-16 code units — surrogate
 * pairs may be split at the boundary). The Zod schema uses the same
 * `maxLength` semantics, so this matches the validation contract.
 *
 * @example
 * sanitizeSiteName("Siraj")                    // → "Siraj"
 * sanitizeSiteName("<script>x</script>Siraj")  // → "xSiraj"
 * sanitizeSiteName("  Siraj  ")                // → "  Siraj  "
 * sanitizeSiteName("a".repeat(100), 5)         // → "aaaaa"
 * sanitizeSiteName(null)                       // → ""
 */
export function sanitizeSiteName(name: unknown, maxLength: number = SITE_NAME_MAX_LENGTH): string {
  if (typeof name !== "string" || name.length === 0) {
    return "";
  }
  // First sanitize via DOMPurify to neutralize any tag that could survive
  // a naive `<[^>]*>` strip (e.g. malformed `<scr<script>ipt>`), then
  // strip any remaining tags, then truncate to the schema's maxLength.
  const sanitized = sanitizeMetadataHtml(name).replace(HTML_TAG_PATTERN, "");
  return sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized;
}

/**
 * Sanitize + truncate a site title (mirrors {@link sanitizeSiteName} but
 * uses the longer {@link SITE_TITLE_MAX_LENGTH} bound — `siteTitle` is
 * documented as the full HTML `<title>` text and the schema allows 120
 * chars).
 *
 * @example
 * sanitizeSiteTitle("Siraj — Quran Learning Platform")
 *   // → "Siraj — Quran Learning Platform"
 */
export function sanitizeSiteTitle(title: unknown, maxLength: number = SITE_TITLE_MAX_LENGTH): string {
  return sanitizeSiteName(title, maxLength);
}

/**
 * Sanitize a metadata description field — slightly looser than
 * {@link sanitizeSiteName} (allows inline formatting tags to survive if
 * the consumer renders them via `dangerouslySetInnerHTML`), but still
 * XSS-safe and truncated to {@link SITE_DESCRIPTION_MAX_LENGTH}.
 *
 * @example
 * sanitizeSiteDescription("Learn <b>Quran</b> online")
 *   // → "Learn <b>Quran</b> online"
 * sanitizeSiteDescription('<script>alert(1)</script>Learn')
 *   // → "Learn"
 */
export function sanitizeSiteDescription(description: unknown, maxLength: number = SITE_DESCRIPTION_MAX_LENGTH): string {
  if (typeof description !== "string" || description.length === 0) {
    return "";
  }
  const sanitized = sanitizeMetadataHtml(description);
  return sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized;
}

/**
 * Structural shape accepted by {@link sanitizeAppearanceFields}.
 *
 * Every field is `unknown`-typed — the sanitizers each accept `unknown`
 * and return a typed primitive. This lets the function accept any
 * `AppearanceFields`-shaped payload (including the GraphQL
 * `AppearanceSettingsSubmitInput`, the JSONB draft blob, or an
 * `NEXT_PUBLIC_APP_BRANDING` parse) without a circular type import from
 * `@/backend/types` (which would violate `shared/` layer isolation).
 */
export interface SanitizableAppearanceFields {
  colors?: {
    light?: { primaryMain?: unknown; secondaryMain?: unknown };
    dark?: { primaryMain?: unknown; secondaryMain?: unknown };
  };
  siteName?: unknown;
  siteTitle?: unknown;
  siteDescription?: unknown;
  logoUrl?: unknown;
  defaultColorScheme?: unknown;
}

/**
 * Apply full sanitization to an {@link AppearanceFields}-shaped payload
 * (AC-34).
 *
 * Returns a shallow-cloned object with every free-form field sanitized:
 *  - Hex colors normalized via {@link normalizeHexColor} (all 4 nested
 *    `colors.{light,dark}.{primaryMain, secondaryMain}` fields).
 *  - `siteName` stripped + truncated via {@link sanitizeSiteName}.
 *  - `siteTitle` stripped + truncated via {@link sanitizeSiteTitle}.
 *  - `siteDescription` sanitized + truncated via
 *    {@link sanitizeSiteDescription}.
 *  - `logoUrl` and `defaultColorScheme` are passed through unchanged
 *    (the Zod schema enforces URL/enum validity; no sanitization needed
 *    here — sanitizing a URL would risk corrupting valid URLs).
 *
 * This is the canonical pre-validation sanitization seam —
 * {@link AppearanceSettingsService.saveDraft} calls this BEFORE
 * `zAppearanceFields.safeParse` so the validator sees already-clean input.
 *
 * @example
 * sanitizeAppearanceFields({
 *   colors: {
 *     light: { primaryMain: " 0D9488 ", secondaryMain: "#4F46E5" },
 *     dark: { primaryMain: "#2DD4BF", secondaryMain: "#818CF8" },
 *   },
 *   siteName: "<b>Siraj</b>",
 *   siteTitle: "Siraj",
 *   siteDescription: '<script>alert(1)</script>Learn Quran online',
 *   logoUrl: null,
 *   defaultColorScheme: "dark",
 * })
 * // → {
 * //   colors: {
 * //     light: { primaryMain: "#0d9488", secondaryMain: "#4f46e5" },
 * //     dark: { primaryMain: "#2dd4bf", secondaryMain: "#818cf8" },
 * //   },
 * //   siteName: "Siraj",
 * //   siteTitle: "Siraj",
 * //   siteDescription: "Learn Quran online",
 * //   logoUrl: null,
 * //   defaultColorScheme: "dark",
 * // }
 */
export function sanitizeAppearanceFields<T extends SanitizableAppearanceFields>(input: T): T {
  if (typeof input !== "object" || input === null) {
    return input;
  }
  const colors = input.colors ?? {};
  const light = colors.light ?? {};
  const dark = colors.dark ?? {};
  return {
    ...input,
    colors: {
      light: {
        ...light,
        primaryMain: normalizeHexColor(light.primaryMain),
        secondaryMain: normalizeHexColor(light.secondaryMain),
      },
      dark: {
        ...dark,
        primaryMain: normalizeHexColor(dark.primaryMain),
        secondaryMain: normalizeHexColor(dark.secondaryMain),
      },
    },
    siteName: sanitizeSiteName(input.siteName),
    siteTitle: sanitizeSiteTitle(input.siteTitle),
    siteDescription: sanitizeSiteDescription(input.siteDescription),
  };
}
