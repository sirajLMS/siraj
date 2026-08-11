import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  commonClassUpdateInputFields,
  registerDeleteEntityMutation,
} from "@/backend/graphql/mutation/classes/__shared__/class-mutation-helpers";
import {
  AttachSubjectResourceInputPothos,
  ClassSubjectCreateInputPothos,
  ClassSubjectPothosObject,
  ClassSubjectUpdateInputPothos,
  SubjectResourcePothosObject,
} from "@/backend/graphql/pothos/classes/class-subject.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ClassSubjectService } from "@/backend/services/subject/class-subject.service";

gqlSchemaBuilder.mutationField("createClassSubject", t =>
  t.field({
    type: ClassSubjectPothosObject,
    args: {
      input: t.arg({ type: ClassSubjectCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const { name, slug, categoryId } = args.input;
      if (!name || !slug || !categoryId) {
        throw new Error(tErrors.auth.invalidCredentials);
      }
      return ClassSubjectService.createSubject(
        userId,
        {
          name,
          slug,
          categoryId,
          description: args.input.description,
          isActive: args.input.isActive ?? undefined,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        tErrors
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
      const tErrors = ctx.t().errorsTranslations;
      return ClassSubjectService.updateSubject(
        userId,
        args.id,
        {
          name: args.input.name ?? undefined,
          slug: args.input.slug ?? undefined,
          categoryId: args.input.categoryId ?? undefined,
          ...commonClassUpdateInputFields(args.input),
        },
        tErrors
      );
    },
  })
);

registerDeleteEntityMutation("deleteClassSubject", ClassSubjectService.deleteSubject.bind(ClassSubjectService));

gqlSchemaBuilder.mutationField("attachSubjectResource", t =>
  t.field({
    type: SubjectResourcePothosObject,
    args: {
      input: t.arg({ type: AttachSubjectResourceInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ClassSubjectService.attachResource(
        userId,
        {
          subjectId: args.input.subjectId,
          learningResourceId: args.input.learningResourceId,
          resourceType: args.input.resourceType,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        tErrors
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
      const tErrors = ctx.t().errorsTranslations;
      await ClassSubjectService.detachResource(userId, args.subjectId, args.learningResourceId, tErrors);
      return true;
    },
  })
);
