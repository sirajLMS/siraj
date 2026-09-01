/**
 * Server-side rich-text HTML sanitizer for user-authored markup (e.g. the
 * credit adjustment Reason persisted to `credit_transactions.notes`).
 *
 * Pure, zero-dependency, allowlist-based rewriter — compatible with the
 * Vercel serverless runtime, AWS Lambda, Node, and Bun. It intentionally
 * does NOT use DOMPurify/jsdom: the jsdom dependency chain
 * (`jsdom → html-encoding-sniffer → @exodus/bytes`) is ESM-only and crashes
 * Vercel's CommonJS web handler on load (`ERR_REQUIRE_ESM`), so a
 * string-based allowlist rewrite is the only safe shape here.
 *
 * Guarantees for the returned string:
 *  - Only allowlisted formatting tags survive, emitted as bare tags with no
 *    attributes — `on*=` handlers, `style`, `href`, and every other
 *    attribute vector are dropped by construction.
 *  - Dangerous container elements (`script`, `style`, `iframe`, `object`,
 *    `embed`, `svg`, `math`) are removed together with their contents, so
 *    payload text never leaks into a rendering context where namespace
 *    confusion (mXSS) could revive it.
 *  - Any `<` that is not part of a sanctioned tag is escaped to `&lt;`, so
 *    an unterminated tag cannot be completed by markup concatenated after
 *    the sanitized fragment.
 *
 * The function never throws and is idempotent:
 * `sanitizeRichText(sanitizeRichText(x)) === sanitizeRichText(x)`.
 */

/**
 * Formatting tags the rich-text Reason editor can produce (bold, italic,
 * underline, bulleted/numbered lists, paragraphs) plus their common inline
 * aliases. No attributes are ever preserved.
 */
const RICH_TEXT_ALLOWED_TAGS = ["b", "br", "em", "i", "li", "ol", "p", "strong", "u", "ul"] as const;

/**
 * Container elements removed with their full contents before the allowlist
 * pass. Their text children are payload material (script source, CSS,
 * foreign-content markup), not user-visible prose.
 */
const DANGEROUS_CONTAINER_TAGS = ["script", "style", "iframe", "object", "embed", "svg", "math"] as const;

/**
 * Matches one complete HTML tag. `<[^<>]*>` is strictly linear (no
 * backtracking) and cannot span an inner `<`, which keeps the rewrite loop
 * deterministic even on adversarial nesting.
 */
const HTML_TAG_PATTERN = /<[^<>]*>/g;

/** `>` (62), `/` (47), or any whitespace — a real boundary after a tag name. */
function isTagNameBoundary(code: number): boolean {
  return code === 62 || code <= 32 || code === 47;
}

/**
 * Remove every `<tagName ...>…</tagName>` block (case-insensitive) using
 * linear `indexOf` scans. An unmatched opener truncates from the opener to
 * the end of the string — the payload tail cannot outlive its container.
 */
function stripContainerBlocks(html: string, tagName: string): string {
  const openPrefix = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let result = html;
  let searchFrom = 0;
  for (;;) {
    const openIndex = result.toLowerCase().indexOf(openPrefix, searchFrom);
    if (openIndex === -1) {
      return result;
    }
    const afterNameIndex = openIndex + openPrefix.length;
    if (afterNameIndex >= result.length) {
      return result.slice(0, openIndex);
    }
    if (!isTagNameBoundary(result.charCodeAt(afterNameIndex))) {
      searchFrom = afterNameIndex;
      continue;
    }
    const gtIndex = result.indexOf(">", afterNameIndex);
    if (gtIndex === -1) {
      return result.slice(0, openIndex);
    }
    const closeIndex = result.toLowerCase().indexOf(closeTag, gtIndex + 1);
    if (closeIndex === -1) {
      return result.slice(0, openIndex);
    }
    result = result.slice(0, openIndex) + result.slice(closeIndex + closeTag.length);
    searchFrom = openIndex;
  }
}

/** Lower-cased tag name extracted from the inside of a tag (no attributes). */
function extractTagName(inside: string): string {
  let end = inside.length;
  for (let i = 0; i < inside.length; i++) {
    const code = inside.charCodeAt(i);
    if (code <= 32 || code === 47 /* / */) {
      end = i;
      break;
    }
  }
  return inside.slice(0, end).toLowerCase();
}

/**
 * Rewrite one matched tag: allowlisted tags survive as bare canonical tags
 * (`<b>` / `</b>`, `<br>` for both forms of the line-break element);
 * everything else is removed entirely, keeping the inner text for the
 * caller-visible content.
 */
function rewriteTag(match: string): string {
  const isClosing = match.startsWith("</");
  const inside = match.slice(isClosing ? 2 : 1, -1).trim();
  const tagName = extractTagName(inside);
  if (!(RICH_TEXT_ALLOWED_TAGS as readonly string[]).includes(tagName)) {
    return "";
  }
  if (tagName === "br") {
    return "<br>";
  }
  if (isClosing) {
    return `</${tagName}>`;
  }
  return `<${tagName}>`;
}

/**
 * Sanitize user-authored rich-text HTML before persisting or re-rendering.
 * Returns the input with only {@link RICH_TEXT_ALLOWED_TAGS} markup
 * preserved, all attributes removed, dangerous containers deleted, and
 * stray `<` characters escaped. Empty input returns an empty string.
 *
 * @example
 * sanitizeRichText("<p>Extra <b>2</b> hours</p>")            // → "<p>Extra <b>2</b> hours</p>"
 * sanitizeRichText('<img src=x onerror=alert(1)>note')        // → "note"
 * sanitizeRichText('<script>alert(1)</script>reason')         // → "reason"
 * sanitizeRichText('<a href="javascript:alert(1)">x</a>')     // → "x"
 * sanitizeRichText("plain reason, no markup")                 // → "plain reason, no markup"
 */
export function sanitizeRichText(html: string): string {
  if (html.length === 0) {
    return "";
  }
  let clean = html;
  for (const tagName of DANGEROUS_CONTAINER_TAGS) {
    clean = stripContainerBlocks(clean, tagName);
  }
  let output = "";
  let index = 0;
  while (index < clean.length) {
    const ltIndex = clean.indexOf("<", index);
    if (ltIndex === -1) {
      output += clean.slice(index);
      break;
    }
    output += clean.slice(index, ltIndex);
    HTML_TAG_PATTERN.lastIndex = ltIndex;
    const tagMatch = HTML_TAG_PATTERN.exec(clean);
    if (tagMatch?.index === ltIndex) {
      output += rewriteTag(tagMatch[0]);
      index = ltIndex + tagMatch[0].length;
    } else {
      output += "&lt;";
      index = ltIndex + 1;
    }
  }
  return output;
}
/** Marker appended when plain text is truncated at its maximum length. */
const PLAIN_TEXT_ELLIPSIS = "…";

/** A stray `<` that survives tag stripping is escaped to this inert entity. */
const ESCAPED_LT = "&lt;";

const STRAY_LT_PATTERN = /</g;

/**
 * Truncates to `maxLength` UTF-16 units (the trailing ellipsis included)
 * without splitting a surrogate pair at the cut, so the result stays valid
 * UTF-16 and fits fixed-width storage.
 */
function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  let cut = Math.max(maxLength - 1, 0);
  const lastUnit = text.charCodeAt(cut - 1);
  if (lastUnit >= 0xd800 && lastUnit <= 0xdbff) {
    cut -= 1;
  }
  return text.slice(0, cut) + PLAIN_TEXT_ELLIPSIS;
}

/**
 * Sanitizes free-form plain text (e.g. an operator note on a payroll
 * calculation) before it is persisted to a column that is rendered as text
 * and must never be interpreted as markup.
 *
 * Guarantees for the returned string:
 *  - Every HTML tag is removed: dangerous container elements (`script`,
 *    `style`, `iframe`, `object`, `embed`, `svg`, `math`) together with their
 *    contents, and every remaining tag with all of its attributes — there is
 *    no allowlist, so no element, event handler, or URL can survive.
 *  - Any `<` that is not part of a tag is escaped to `&lt;`, so markup
 *    concatenated after the stored value cannot complete an unterminated tag.
 *  - Character entities (`&lt;`, `&#x61;`, …) pass through as inert text:
 *    entity references never re-tokenize as markup at render time.
 *  - The result is at most `maxLength` characters long, the trailing ellipsis
 *    included, and never splits a surrogate pair at the truncation boundary.
 *
 * Pure, synchronous, never throws, and idempotent:
 * `sanitizePlainText(sanitizePlainText(x)) === sanitizePlainText(x)`.
 *
 * @example
 * sanitizePlainText("<script>alert(1)</script>Refund") // → "Refund"
 * sanitizePlainText("Paid <b>in full</b>")             // → "Paid in full"
 * sanitizePlainText("a < b")                           // → "a &lt; b"
 */
export function sanitizePlainText(text: string, maxLength = 2000): string {
  if (text.length === 0) {
    return "";
  }
  let clean = text;
  for (const tagName of DANGEROUS_CONTAINER_TAGS) {
    clean = stripContainerBlocks(clean, tagName);
  }
  clean = clean.replace(HTML_TAG_PATTERN, "");
  clean = clean.replace(STRAY_LT_PATTERN, ESCAPED_LT);
  return truncateWithEllipsis(clean, maxLength);
}
