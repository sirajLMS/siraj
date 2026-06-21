import { ParentDocumentService } from "@/backend/services/parent/parent-document.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type ParentDocumentDefinition = {
  id: string;
  fileId: string;
  filePath: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
};

const ParentDocumentRef = gqlSchemaBuilder.objectRef<ParentDocumentDefinition>("ParentDocument");

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
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentDocumentService.getParentDocuments(ctx.user?.id || "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("linkDocumentToParent", t =>
  t.field({
    type: ParentDocumentRef,
    args: {
      parentId: t.arg.string({ required: true }),
      fileId: t.arg.string({ required: true }),
      usageType: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await ParentDocumentService.linkDocumentToParent(
        ctx.user?.id || "",
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
