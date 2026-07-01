import { ClassCategoryService } from "@/backend/services/subject/class-category.service";
import { ClassSubjectService } from "@/backend/services/subject/class-subject.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ClassCategoryPothosObject } from "../pothos/class-category.pothos";
import { ClassSubjectPothosObject } from "../pothos/class-subject.pothos";
import { requireAuth } from "../utils/requireAuth";

gqlSchemaBuilder.queryField("classCategories", t =>
  t.field({
    type: [ClassCategoryPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return ClassCategoryService.listCategories(userId, ctx.locale);
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
      return ClassSubjectService.listSubjects(userId, args.categoryId ?? undefined, ctx.locale);
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
      return ClassSubjectService.getSubjectById(userId, args.id, ctx.locale);
    },
  })
);
