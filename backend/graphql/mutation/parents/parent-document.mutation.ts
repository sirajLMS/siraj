// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ParentDocumentRef } from "@/backend/graphql/pothos/parents/parent-document.pothos";
import { ParentDocumentService } from "@/backend/services";

gqlSchemaBuilder.mutationField("linkDocumentToParent", t =>
  t.field({
    type: ParentDocumentRef,
    authScopes: { superAdmin: true },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      fileId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      usageType: t.arg.string({ required: true, directives: { constraint: { maxLength: 64 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await ParentDocumentService.linkDocumentToParent(
        requireUserId(ctx),
        args.parentId,
        args.fileId,
        args.usageType,
        ctx.locale
      );
      // Shape the result to match ParentDocument type
      return {
        id: result.id,
        fileId: result.fileId,
        filePath: "", // filePath resolved on next query — linking returns minimal data
        isProtected: false, // default for newly linked docs
        usageType: result.usageType,
        createdAt: result.createdAt,
      };
    },
  })
);
