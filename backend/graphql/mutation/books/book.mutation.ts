// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { BookService } from "@/backend/services";

gqlSchemaBuilder.mutationField("deleteBook", t =>
  t.boolean({
    authScopes: { superAdmin: true },
    description: "Soft-deletes a book by marking it as deleted.",
    args: {
      id: t.arg.id({ required: true, description: "The UUID of the book to delete" }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }

      return BookService.deleteBook(args.id, ctx.user.id, ctx.locale);
    },
  })
);
