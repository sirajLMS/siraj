import type { ClassCategoryCreateInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CategoryFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/category.schema";

export function categoryFormValuesToCreateInput(data: CategoryFormValues): ClassCategoryCreateInput {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    isActive: data.isActive ?? null,
    sortOrder: null,
  };
}
