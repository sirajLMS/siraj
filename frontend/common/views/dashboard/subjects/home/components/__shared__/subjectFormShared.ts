// Re-export the lifted schema artifacts so existing import sites
// (e.g. the shared form-field components used by the dialogs) keep working
// during the migration. The canonical home is now
// `frontend/common/views/dashboard/subjects/home/schemas/{subject,category}.schema.ts`
// per specs.md §5.
import { z } from "zod";

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

// Keep the local `entityFormBaseSchema` shape around (as a type-only export)
// for any consumer that still imports it; however we mark it as deprecated so
// new code should import from the canonical schema files instead.
export const entityFormBaseSchema = {
  name: z.string().min(1, "nameRequired"),
  slug: z.string().min(1, "slugRequired"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
} as const;
