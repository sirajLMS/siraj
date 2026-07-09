import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AvailabilityStatusPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { BookService } from "@/backend/services/resource/book.service";
import type { BookReturnType } from "@/backend/types/books/book.types";

const BookRef = gqlSchemaBuilder.objectRef<BookReturnType>("Book");

export const BookPothosObject = BookRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    availabilityStatus: t.expose("availabilityStatus", { type: AvailabilityStatusPothosObject }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

gqlSchemaBuilder.queryField("booksAndBags", t =>
  t.field({
    type: [BookPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const locale = ctx.locale || "en";
      const userId = ctx.user.id;

      return await BookService.listBooks(userId, locale);
    },
    description: "Lists all books and bags available to the academy.",
  })
);

gqlSchemaBuilder.mutationField("deleteBook", t =>
  t.boolean({
    authScopes: { superAdmin: true },
    description: "Soft-deletes a book by marking it as deleted.",
    args: {
      id: t.arg.id({ required: true, description: "The UUID of the book to delete" }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      return BookService.deleteBook(String(args.id), ctx.user.id, ctx.locale);
    },
  })
);
