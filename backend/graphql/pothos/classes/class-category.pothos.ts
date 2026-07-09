import { ClassCategoryRepository } from "@/backend/db/repo/class-category.repository";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { getBackendTranslations } from "@/backend/lib/intl";
import type { ClassCategoryReturnType } from "@/backend/types";

export const ClassCategoryPothosObject = gqlSchemaBuilder
  .loadableObjectRef<ClassCategoryReturnType, string>("ClassCategory", {
    load: async (ids: string[], ctx) => {
      const categories = await ClassCategoryRepository.loadByIds(ids);
      const map = new Map(categories.map(c => [c.id, c]));
      const t = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
      return ids.map(id => map.get(id) ?? new Error(t("categoryNotFound", { id })));
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
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});

export const ClassCategoryUpdateInputPothos = gqlSchemaBuilder.inputType("ClassCategoryUpdateInput", {
  fields: t => ({
    name: t.string({ required: false }),
    slug: t.string({ required: false }),
    description: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});
