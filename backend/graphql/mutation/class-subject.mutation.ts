import { ClassSubjectService } from "@/backend/services/subject/class-subject.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  AttachSubjectResourceInputPothos,
  ClassSubjectCreateInputPothos,
  ClassSubjectPothosObject,
  ClassSubjectUpdateInputPothos,
  SubjectResourcePothosObject,
} from "../pothos/class-subject.pothos";
import { requireAuth } from "../utils/requireAuth";

gqlSchemaBuilder.mutationField("createClassSubject", t =>
  t.field({
    type: ClassSubjectPothosObject,
    args: {
      input: t.arg({ type: ClassSubjectCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ClassSubjectService.createSubject(
        userId,
        {
          name: args.input.name,
          slug: args.input.slug,
          categoryId: args.input.categoryId,
          description: args.input.description,
          isActive: args.input.isActive ?? undefined,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateClassSubject", t =>
  t.field({
    type: ClassSubjectPothosObject,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: ClassSubjectUpdateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ClassSubjectService.updateSubject(
        userId,
        args.id,
        {
          name: args.input.name ?? undefined,
          slug: args.input.slug ?? undefined,
          categoryId: args.input.categoryId ?? undefined,
          description: args.input.description,
          isActive: args.input.isActive ?? undefined,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteClassSubject", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      await ClassSubjectService.deleteSubject(userId, args.id, ctx.locale);
      return true;
    },
  })
);

gqlSchemaBuilder.mutationField("attachSubjectResource", t =>
  t.field({
    type: SubjectResourcePothosObject,
    args: {
      input: t.arg({ type: AttachSubjectResourceInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ClassSubjectService.attachResource(
        userId,
        {
          subjectId: args.input.subjectId,
          learningResourceId: args.input.learningResourceId,
          resourceType: args.input.resourceType,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("detachSubjectResource", t =>
  t.field({
    type: "Boolean",
    args: {
      subjectId: t.arg.id({ required: true }),
      learningResourceId: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      await ClassSubjectService.detachResource(userId, args.subjectId, args.learningResourceId, ctx.locale);
      return true;
    },
  })
);
