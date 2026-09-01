/**
 * Lowercases, trims, and kebab-cases the given text for use as a URL slug.
 * Shared across the create/edit category and subject dialogs so the
 * auto-generated slug stays consistent.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
