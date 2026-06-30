import { ClassCategoryService } from "@/backend/services/subject/class-category.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  ClassCategoryCreateInputPothos,
  ClassCategoryPothosObject,
  ClassCategoryUpdateInputPothos,
} from "../pothos/class-category.pothos";
import { requireAuth } from "../utils/requireAuth";

gqlSchemaBuilder.mutationField("createClassCategory", t =>
  t.field({
    type: ClassCategoryPothosObject,
    args: {
      input: t.arg({ type: ClassCategoryCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ClassCategoryService.createCategory(
        userId,
        {
          name: args.input.name,
          slug: args.input.slug,
          description: args.input.description,
          isActive: args.input.isActive ?? undefined,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        ctx.locale
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
      return ClassCategoryService.updateCategory(
        userId,
        args.id,
        {
          name: args.input.name ?? undefined,
          slug: args.input.slug ?? undefined,
          description: args.input.description,
          isActive: args.input.isActive ?? undefined,
          sortOrder: args.input.sortOrder ?? undefined,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteClassCategory", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      await ClassCategoryService.deleteCategory(userId, args.id, ctx.locale);
      return true;
    },
  })
);
