import { ClassCategoryRepository } from "@/backend/db/repo/classes/class-category.repository";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ClassCategoryPothosObject } from "@/backend/graphql/pothos/classes/class-category.pothos";
import { ClassSubjectService } from "@/backend/services/subject/class-subject.service";
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
    category: t.loadable({
      type: ClassCategoryPothosObject,
      nullable: true,
      load: async (ids: string[], ctx) => {
        const categories = await ClassCategoryRepository.loadByIds(ids);
        const map = new Map(categories.map(c => [c.id, c]));
        const tErrors = await ctx.t("errors");
        return ids.map(id => map.get(id) ?? new Error(tErrors.categoryNotFound(id)));
      },
      resolve: parent => parent.categoryId,
    }),
    resources: t.field({
      type: [SubjectResourcePothosObject],
      resolve: async (parent, _args, ctx) => {
        const tErrors = await ctx.t("errors");
        return ClassSubjectService.getSubjectResources(ctx.user?.id ?? "", parent.id, tErrors);
      },
    }),
  }),
});

export const ClassSubjectCreateInputPothos = gqlSchemaBuilder.inputType("ClassSubjectCreateInput", {
  fields: t => ({
    name: t.string({ required: true }),
    slug: t.string({ required: true }),
    categoryId: t.string({ required: true }),
    description: t.string({ required: false }),
    avatarUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});

export const ClassSubjectUpdateInputPothos = gqlSchemaBuilder.inputType("ClassSubjectUpdateInput", {
  fields: t => ({
    name: t.string({ required: false }),
    slug: t.string({ required: false }),
    categoryId: t.string({ required: false }),
    description: t.string({ required: false }),
    avatarUrl: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});

export const AttachSubjectResourceInputPothos = gqlSchemaBuilder.inputType("AttachSubjectResourceInput", {
  fields: t => ({
    subjectId: t.string({ required: true }),
    learningResourceId: t.string({ required: true }),
    resourceType: t.string({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});
