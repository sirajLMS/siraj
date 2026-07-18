// NEW FOR PLAN v5: Canonical home for subject form schemas per specs.md §5
// (Zod schemas live in `frontend/common/views/dashboard/<domain>/schemas/<formName>.schema.ts`).
// The previous inline schema in `components/__shared__/subjectFormShared.ts` was lifted here
// so tier dialog files no longer import schemas from a `__shared__` UI-primitive barrel.
import { z } from "zod";

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
 * Subject create/edit form schema. Adds the required `categoryId` selector on
 * top of the shared base fields.
 */
export const subjectFormSchema = z.object({
  ...entityFormBaseSchema,
  categoryId: z.string().min(1, "categoryRequired"),
});

export type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export const emptySubjectFormValues: SubjectFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  isActive: true,
};
