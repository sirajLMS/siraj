import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ClassCategoryService } from "@/backend/services";
import type { ClassCategoryReturnType } from "@/backend/types";

export const ClassCategoryPothosObject = gqlSchemaBuilder
  .loadableObjectRef<ClassCategoryReturnType, string>("ClassCategory", {
    load: async (ids: string[], ctx) => {
      const categories = await ClassCategoryService.loadByIds(ids);
      const map = new Map(categories.map(c => [c.id, c]));
      const tErrors = ctx.t().errorsTranslations;
      return ids.map(id => map.get(id) ?? new Error(tErrors.categoryNotFound(id)));
    },
    sort: c => c.id,
  })
  .implement({
    fields: t => ({
      id: t.exposeString("id"),
      name: t.exposeString("name"),
      slug: t.exposeString("slug"),
      description: t.exposeString("description", { nullable: true }),
      isActive: t.exposeBoolean("isActive"),
      sortOrder: t.exposeInt("sortOrder"),
    }),
  });

export const ClassCategoryCreateInputPothos = gqlSchemaBuilder.inputType("ClassCategoryCreateInput", {
  fields: t => ({
    name: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    slug: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    description: t.string({ required: false, directives: { constraint: { maxLength: 500 } } }),
    isActive: t.boolean({ required: false }),
    sortOrder: t.int({ required: false, directives: { constraint: { min: 0, max: 999 } } }),
  }),
});

export const ClassCategoryUpdateInputPothos = gqlSchemaBuilder.inputType("ClassCategoryUpdateInput", {
  fields: t => ({
    name: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    slug: t.string({ required: false, directives: { constraint: { maxLength: 100 } } }),
    description: t.string({ required: false, directives: { constraint: { maxLength: 500 } } }),
    isActive: t.boolean({ required: false }),
    sortOrder: t.int({ required: false, directives: { constraint: { min: 0, max: 999 } } }),
  }),
});
