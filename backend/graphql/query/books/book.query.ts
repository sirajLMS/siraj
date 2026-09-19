// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { BookPothosObject } from "@/backend/graphql/pothos/books/book.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BookService } from "@/backend/services";

gqlSchemaBuilder.queryField("booksAndBags", t =>
  t.field({
    type: [BookPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const locale = ctx.locale || "en";

      return await BookService.listBooks(userId, locale);
    },
    description: "Lists all books and bags available to the academy.",
  })
);
