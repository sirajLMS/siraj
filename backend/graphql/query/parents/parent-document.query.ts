// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ParentDocumentRef } from "@/backend/graphql/pothos/parents/parent-document.pothos";
import { ParentDocumentService } from "@/backend/services";

gqlSchemaBuilder.queryField("parentDocuments", t =>
  t.field({
    type: [ParentDocumentRef],
    authScopes: { loggedIn: true },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentDocumentService.getParentDocuments(requireUserId(ctx), args.parentId, ctx.locale);
    },
  })
);
