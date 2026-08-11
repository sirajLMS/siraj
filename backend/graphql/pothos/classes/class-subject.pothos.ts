import { ClassCategoryRepository } from "@/backend/db/repo/classes/class-category.repository";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { classSubjectInputFields } from "@/backend/graphql/pothos/classes/__shared__/classSubjectFieldHelpers";
import { ClassCategoryPothosObject } from "@/backend/graphql/pothos/classes/class-category.pothos";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { ClassSubjectReturnType, SubjectResourceReturnType } from "@/backend/types";

const SubjectResourceRef = gqlSchemaBuilder.objectRef<SubjectResourceReturnType>("SubjectResource");

export const SubjectResourcePothosObject = SubjectResourceRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    subjectId: t.exposeString("subjectId"),
    learningResourceId: t.exposeString("learningResourceId"),
    resourceType: t.exposeString("resourceType", { nullable: true }),
    sortOrder: t.exposeInt("sortOrder"),
    displayName: t.exposeString("displayName", { nullable: true }),
    filePath: t.exposeString("filePath", { nullable: true }),
  }),
});

const ClassSubjectRef = gqlSchemaBuilder.objectRef<ClassSubjectReturnType>("ClassSubject");

export const ClassSubjectPothosObject = ClassSubjectRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    sortOrder: t.exposeInt("sortOrder"),
    categoryId: t.exposeString("categoryId"),
    hourlyRate: t.exposeString("hourlyRate", { nullable: true }),
    rateCurrency: t.expose("rateCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    category: t.loadable({
      type: ClassCategoryPothosObject,
      nullable: true,
      load: async (ids: string[]) => {
        const categories = await ClassCategoryRepository.loadByIds(ids);
        const map = new Map(categories.map(c => [c.id, c]));
        return ids.map(id => map.get(id) ?? null);
      },
      resolve: parent => parent.categoryId,
    }),
    resources: t.expose("resources", { type: [SubjectResourcePothosObject] }),
  }),
});

export const ClassSubjectCreateInputPothos = gqlSchemaBuilder.inputType("ClassSubjectCreateInput", {
  fields: t => classSubjectInputFields(t, { name: true, slug: true, categoryId: true }),
});

export const ClassSubjectUpdateInputPothos = gqlSchemaBuilder.inputType("ClassSubjectUpdateInput", {
  fields: t => classSubjectInputFields(t, { name: false, slug: false, categoryId: false }),
});

export const AttachSubjectResourceInputPothos = gqlSchemaBuilder.inputType("AttachSubjectResourceInput", {
  fields: t => ({
    subjectId: t.string({ required: true }),
    learningResourceId: t.string({ required: true }),
    resourceType: t.string({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});
