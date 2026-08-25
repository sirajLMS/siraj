// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { BookPothosObject } from "@/backend/graphql/pothos/books/book.pothos";
import { BookService } from "@/backend/services";

gqlSchemaBuilder.queryField("booksAndBags", t =>
  t.field({
    type: [BookPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user?.id) {
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }

      const locale = ctx.locale || "en";
      const userId = ctx.user.id;

      return await BookService.listBooks(userId, locale);
    },
    description: "Lists all books and bags available to the academy.",
  })
);
