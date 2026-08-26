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
 *     {@link sanitizeMetadataHtml} strips `<script>`, `onload=`,
 *     `javascript:`, and other XSS vectors with a pure allowlist rewrite.
 *     The result is plain text or a tight subset of inline formatting tags.
 *
 *  3. **Site name / title** (rendered in `<title>`, `og:site_name`):
 *     {@link sanitizeSiteName} strips all HTML tags (these fields are plain
 *     text) and truncates to the schema's `maxLength`.
 *
 * ---------------------------------------------------------------------------
 * SECURITY REVIEW / AGENTS — DO NOT REINTRODUCE DOMPurify / jsdom
 * ---------------------------------------------------------------------------
 *
 * This module MUST remain a zero-dependency, pure-TypeScript sanitizer.
 *
 * Banned (do not suggest, do not re-add to package.json, do not import):
 *   - `isomorphic-dompurify`
 *   - `dompurify` + `jsdom` (or happy-dom / linkedom wired for DOMPurify)
 *   - any other sanitizer that pulls `jsdom` / `html-encoding-sniffer` /
 *     `@exodus/bytes` into the Next.js server / Vercel serverless graph
 *
 * Why (production incident 2026-08-26):
 *   Vercel’s Node function runtime disables Node’s
 *   `require(ESM)` (`--no-experimental-require-module` equivalent).
 *   `isomorphic-dompurify` → `jsdom@30+` → `html-encoding-sniffer@6` →
 *   `@exodus/bytes` (ESM-only). Loading that chain from CommonJS
 *   (instrumentation / server handler) throws `ERR_REQUIRE_ESM` and
 *   takes down the entire Web Handler before any request is served.
 *
 * If a review finds gaps in this allowlist sanitizer, fix THIS file
 * (tighten tags/attrs/href rules) — do not “upgrade” to DOMPurify/jsdom.
 * For richer HTML elsewhere, prefer a package that is ESM-clean on
 * Vercel without jsdom, or sanitize in a browser-only path.
 * ---------------------------------------------------------------------------
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
// theme-token-allow: hex-schema-input-validation only; never use in sx or styled()
export const INVALID_HEX_FALLBACK = "#000000";

/**
 * HTML tag stripper — used by {@link sanitizeSiteName} to coerce to plain
 * text after HTML sanitization has already neutralized any nested malformations
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
 * Dangerous container tags whose open+close pair (and contents) are removed
 * before allowlist rewriting. IndexOf-based so we avoid `[\s\S]*?` regexes.
 */
const DANGEROUS_CONTAINER_TAGS = ["script", "style", "iframe", "object", "embed", "svg", "math"] as const;

/**
 * Strip one container element (and its contents) using linear indexOf scans.
 */
function stripContainerBlocks(html: string, tagName: string): string {
  const openPrefix = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let result = html;
  let searchFrom = 0;
  for (;;) {
    const lower = result.toLowerCase();
    const openIdx = lower.indexOf(openPrefix, searchFrom);
    if (openIdx === -1) {
      return result;
    }
    const afterNameIdx = openIdx + openPrefix.length;
    if (afterNameIdx >= result.length) {
      return result.slice(0, openIdx);
    }
    const boundary = result.charCodeAt(afterNameIdx);
    // Require a real tag boundary so `<script>` matches but `<scripter>` does not.
    const isBoundary = boundary === 62 /* > */ || boundary <= 32 || boundary === 47 /* / */;
    if (!isBoundary) {
      searchFrom = afterNameIdx;
      continue;
    }
    const gtIdx = result.indexOf(">", afterNameIdx);
    if (gtIdx === -1) {
      return result.slice(0, openIdx);
    }
    const closeIdx = result.toLowerCase().indexOf(closeTag, gtIdx + 1);
    if (closeIdx === -1) {
      return result.slice(0, openIdx);
    }
    result = result.slice(0, openIdx) + result.slice(closeIdx + closeTag.length);
    searchFrom = openIdx;
  }
}

/**
 * Extract `href` attribute value from tag attributes string without regex.
 */
function extractHref(attrs: string): string | null {
  const hrefIndex = attrs.toLowerCase().indexOf("href");
  if (hrefIndex === -1) {
    return null;
  }
  const afterHref = attrs.slice(hrefIndex + 4).trimStart();
  if (!afterHref.startsWith("=")) {
    return null;
  }
  const afterEqual = afterHref.slice(1).trimStart();
  if (afterEqual.startsWith('"')) {
    const end = afterEqual.indexOf('"', 1);
    return end !== -1 ? afterEqual.slice(1, end) : null;
  }
  if (afterEqual.startsWith("'")) {
    const end = afterEqual.indexOf("'", 1);
    return end !== -1 ? afterEqual.slice(1, end) : null;
  }
  let end = afterEqual.length;
  for (let i = 0; i < afterEqual.length; i++) {
    const code = afterEqual.charCodeAt(i);
    if (code <= 32 || code === 60 || code === 62) {
      end = i;
      break;
    }
  }
  return afterEqual.slice(0, end);
}

/**
 * Check if a URL uses a safe protocol for metadata links.
 */
function isSafeHref(href: string): boolean {
  const normalized = href.trim();
  let withoutControls = "";
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code > 32) {
      withoutControls += normalized[i];
    }
  }
  if (/^(?:javascript|data|vbscript):/i.test(withoutControls)) {
    return false;
  }
  return /^(?:https?:\/\/|mailto:|tel:|\/|\.\/|#)/i.test(normalized);
}

/**
 * Allowlist of inline formatting tags preserved by
 * {@link sanitizeMetadataHtml} when sanitizing `siteDescription`.
 *
 * Metadata contexts (`<meta name="description">`, `og:description`) render
 * as plain text in most consumers (search engines, social previews), so
 * preserving inline formatting tags is harmless — they're stripped by the
 * renderer. We keep a tight allowlist so the sanitized output is auditable.
 */
const METADATA_ALLOWED_TAGS = ["b", "i", "em", "strong", "a", "p", "br"] as const;

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
 * Build the sanitized opening tag for an allowlisted element.
 */
function buildOpeningTag(tagName: string, rawAttrs: string): string {
  if (tagName === "br") {
    return "<br>";
  }
  if (tagName === "a") {
    const rawHref = rawAttrs ? extractHref(rawAttrs) : null;
    if (rawHref && isSafeHref(rawHref)) {
      return `<a href="${rawHref.replace(/"/g, "&quot;")}">`;
    }
    return "<a>";
  }
  return `<${tagName}>`;
}

/**
 * Extract tag name and attributes from the inside of an HTML tag.
 */
function parseTagParts(inside: string): { rawTagName: string; rawAttrs: string } {
  let spaceIndex = -1;
  for (let i = 0; i < inside.length; i++) {
    const code = inside.charCodeAt(i);
    if (code <= 32 || code === 47 /* / */) {
      spaceIndex = i;
      break;
    }
  }
  return {
    rawTagName: spaceIndex === -1 ? inside : inside.slice(0, spaceIndex),
    rawAttrs: spaceIndex === -1 ? "" : inside.slice(spaceIndex),
  };
}

/**
 * Transform a matched HTML tag into an allowed/sanitized tag representation.
 */
function transformHtmlTag(match: string): string {
  const isClosing = match.startsWith("</");
  const inside = match.slice(isClosing ? 2 : 1, -1).trim();
  const { rawTagName, rawAttrs } = parseTagParts(inside);
  const tagName = rawTagName.toLowerCase();
  const isAllowed = (METADATA_ALLOWED_TAGS as readonly string[]).includes(tagName);
  if (!isAllowed) {
    return "";
  }
  if (isClosing) {
    return tagName === "br" ? "<br>" : `</${tagName}>`;
  }
  return buildOpeningTag(tagName, rawAttrs);
}

/**
 * Sanitize a metadata HTML payload by stripping dangerous tags/attributes
 * (AC-34).
 *
 * Pure zero-dependency allowlist rewriter — compatible with Vercel serverless,
 * AWS Lambda, Node, and Bun. Intentionally NOT DOMPurify / isomorphic-dompurify
 * / jsdom (see file-header ban for security reviewers).
 *
 * Strips:
 *   - `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<style>` tags and their contents.
 *   - All `on*` event-handler attributes (`onload`, `onerror`, …).
 *   - `javascript:`, `data:`, `vbscript:` URIs in `href`.
 *
 * For metadata contexts (`<meta name="description">`, OpenGraph tags) the
 * returned value preserves a tight allowlist of inline formatting tags
 * (`<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>`) — safe to
 * render via `dangerouslySetInnerHTML` if a future UI ever needs to.
 * Callers that need a stricter plain-text form should pipe the result
 * through {@link sanitizeSiteName}.
 *
 * The function never throws. An empty input returns an empty string.
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
    let clean = html;
    for (const tagName of DANGEROUS_CONTAINER_TAGS) {
      clean = stripContainerBlocks(clean, tagName);
    }
    return clean.replace(HTML_TAG_PATTERN, transformHtmlTag);
  } catch {
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
  // First sanitize to neutralize any tag that could survive a naive
  // `<[^>]*>` strip (e.g. malformed `<scr<script>ipt>`), then strip any
  // remaining tags, then truncate to the schema's maxLength.
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
