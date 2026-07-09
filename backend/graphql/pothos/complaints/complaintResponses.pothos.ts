import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ComplaintResponseService } from "@/backend/services";
import type { ComplaintResponseReturnType, ComplaintResponseSubmitInput } from "@/backend/types";

const ComplaintResponseRef = gqlSchemaBuilder.objectRef<ComplaintResponseReturnType>("ComplaintResponse");

export const ComplaintResponsePothosObject = ComplaintResponseRef.implement({
  description: "A single response to a complaint.",
  fields: t => ({
    id: t.exposeString("id"),
    complaintId: t.exposeString("complaintId"),
    body: t.exposeString("body"),
    emailSent: t.exposeBoolean("emailSent"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    responderName: t.exposeString("responderName", { nullable: true }),
  }),
});

export const RespondToComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintResponseSubmitInput>("RespondToComplaintInput")
  .implement({
    description: "Input for responding to a complaint.",
    fields: t => ({
      complaintId: t.string({ required: true }),
      body: t.string({ required: true }),
    }),
  });

gqlSchemaBuilder.mutationField("respondToComplaint", t =>
  t.field({
    type: ComplaintResponsePothosObject,
    authScopes: { superAdmin: true },
    description: "Creates a response to an existing complaint (admin only).",
    args: {
      input: t.arg({ type: RespondToComplaintInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const response = await ComplaintResponseService.respondToComplaint(
        { complaintId: args.input.complaintId, body: args.input.body },
        ctx.user.id,
        ctx.locale
      );

      return {
        id: response.id,
        complaintId: response.complaintId,
        body: response.body,
        emailSent: response.emailSent,
        createdAt: response.createdAt,
        responderName: null,
      };
    },
  })
);
