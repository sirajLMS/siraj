// NEW FOR PLAN v5: Canonical home for category form schemas per specs.md §5.
// Lifted from the inline `z.object(...)` declaration that previously lived in
// both `editCategoryDialog.mobile.tsx` and `editCategoryDialog.desktop.tsx`
// (each tier declared its own byte-identical copy), and from the create-form
// schema that used to live in `components/__shared__/subjectFormShared.ts`.
//
// `slugify` is intentionally NOT re-exported from here — pure-data helpers live
// in `frontend/common/views/dashboard/<domain>/utils/`. The shared slugify
// remains in `components/__shared__/subjectFormShared.ts` for legacy callers
// during the migration wave.
import { z } from "zod";

import { entityFormBaseSchema } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";

/** Category create/edit form schema (name, slug, description, isActive). */
export const categoryFormSchema = z.object(entityFormBaseSchema);

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export type EditCategoryFormValues = z.infer<typeof categoryFormSchema>;

export const emptyCategoryFormValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};
