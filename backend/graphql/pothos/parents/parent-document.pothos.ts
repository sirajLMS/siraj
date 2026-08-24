import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ParentDocumentService } from "@/backend/services";
import type { ParentDocument } from "@/backend/types";

const ParentDocumentRef = gqlSchemaBuilder.objectRef<ParentDocument>("ParentDocument");

export const ParentDocumentPothosObject = ParentDocumentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    fileId: t.exposeString("fileId"),
    filePath: t.exposeString("filePath"),
    isProtected: t.exposeBoolean("isProtected"),
    usageType: t.exposeString("usageType"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

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
