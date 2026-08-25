import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { ParentDocumentRow } from "@/backend/types";

export const ParentDocumentRef = gqlSchemaBuilder.objectRef<ParentDocumentRow>("ParentDocumentRow");

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
