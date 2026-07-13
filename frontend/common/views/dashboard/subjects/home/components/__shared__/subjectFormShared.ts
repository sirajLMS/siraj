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

/**
 * Shared base schema used by both the category and subject forms. The subject
 * dialogs extend this with a `categoryId` field.
 */
export const entityFormBaseSchema = {
  name: z.string().min(1, "nameRequired"),
  slug: z.string().min(1, "slugRequired"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
} as const;

/**
 * Category create/edit form schema (name, slug, description, isActive).
 */
export const categoryFormSchema = z.object(entityFormBaseSchema);

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/**
 * Subject create/edit form schema. Adds the required `categoryId` selector on
 * top of the shared base fields.
 */
export const subjectFormSchema = z.object({
  ...entityFormBaseSchema,
  categoryId: z.string().min(1, "categoryRequired"),
});

export type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export const emptyCategoryFormValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};

export const emptySubjectFormValues: SubjectFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  isActive: true,
};
