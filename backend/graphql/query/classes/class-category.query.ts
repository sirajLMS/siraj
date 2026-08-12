import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ClassCategoryPothosObject } from "@/backend/graphql/pothos/classes/class-category.pothos";
import { ClassSubjectPothosObject } from "@/backend/graphql/pothos/classes/class-subject.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ClassCategoryService, ClassSubjectService } from "@/backend/services";

gqlSchemaBuilder.queryField("classCategories", t =>
  t.field({
    type: [ClassCategoryPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ClassCategoryService.listCategories(userId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("classSubjects", t =>
  t.field({
    type: [ClassSubjectPothosObject],
    args: {
      categoryId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ClassSubjectService.listSubjects(userId, tErrors, args.categoryId ?? undefined);
    },
  })
);

gqlSchemaBuilder.queryField("classSubject", t =>
  t.field({
    type: ClassSubjectPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ClassSubjectService.getSubjectById(userId, args.id, tErrors);
    },
  })
);
