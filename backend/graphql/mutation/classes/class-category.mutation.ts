import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  commonClassUpdateInputFields,
  registerDeleteEntityMutation,
} from "@/backend/graphql/mutation/classes/__shared__/class-mutation-helpers";
import {
  ClassCategoryCreateInputPothos,
  ClassCategoryPothosObject,
  ClassCategoryUpdateInputPothos,
} from "@/backend/graphql/pothos/classes/class-category.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ClassCategoryService } from "@/backend/services";

gqlSchemaBuilder.mutationField("createClassCategory", t =>
  t.field({
    type: ClassCategoryPothosObject,
    args: {
      input: t.arg({ type: ClassCategoryCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ClassCategoryService.createCategory(
        userId,
        {
          name: args.input.name,
          slug: args.input.slug,
          description: args.input.description,
          isActive: args.input.isActive ?? undefined,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateClassCategory", t =>
  t.field({
    type: ClassCategoryPothosObject,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: ClassCategoryUpdateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ClassCategoryService.updateCategory(
        userId,
        args.id,
        {
          name: args.input.name ?? undefined,
          slug: args.input.slug ?? undefined,
          ...commonClassUpdateInputFields(args.input),
        },
        tErrors
      );
    },
  })
);

registerDeleteEntityMutation("deleteClassCategory", ClassCategoryService.deleteCategory.bind(ClassCategoryService));
