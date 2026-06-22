import { LearningResourceService } from "@/backend/services/resource/learning-resource.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── Input Types ──────────────────────────────────────────────────────────────

const ResourceUploadInput = gqlSchemaBuilder.inputType("ResourceUploadInput", {
  fields: t => ({
    displayName: t.string({ required: true }),
    filePath: t.string({ required: true }),
    fileId: t.id({ required: true }),
  }),
});

// ─── Object Types ─────────────────────────────────────────────────────────────

export interface LearningResourceRowDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly uploadedByUserName: string | null;
  readonly fileSize: number | null;
  readonly contentType: string | null;
  readonly createdAt: Date;
}

const LearningResourceRowRef = gqlSchemaBuilder.objectRef<LearningResourceRowDefinition>("LearningResourceRow");

export const LearningResourceRowPothosObject = LearningResourceRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    displayName: t.exposeString("displayName"),
    filePath: t.exposeString("filePath"),
    uploadedByUserId: t.exposeString("uploadedByUserId"),
    uploadedByUserName: t.exposeString("uploadedByUserName", { nullable: true }),
    fileSize: t.exposeFloat("fileSize", { nullable: true }),
    contentType: t.exposeString("contentType", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// ─── Queries & Mutations ─────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("learningResources", t =>
  t.field({
    type: [LearningResourceRowPothosObject],
    args: {
      searchQuery: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const locale = ctx.locale || "en";
      const userId = ctx.user?.id || "";

      const result = await LearningResourceService.listResources(userId, args.searchQuery ?? undefined, locale);

      return result.rows;
    },
    description: "Lists all learning resources available to the academy.",
  })
);

gqlSchemaBuilder.mutationField("uploadLearningResource", t =>
  t.field({
    type: LearningResourceRowPothosObject,
    args: {
      input: t.arg({ type: ResourceUploadInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const locale = ctx.locale || "en";
      const userId = ctx.user?.id || "";

      return await LearningResourceService.createResource(userId, args.input, locale);
    },
    description: "Uploads a new learning resource to the academy library.",
  })
);
