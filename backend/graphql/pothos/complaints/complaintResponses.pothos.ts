import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { ComplaintResponseReturnType, ComplaintResponseSubmitInput } from "@/backend/types";

export const ComplaintResponseRef = gqlSchemaBuilder.objectRef<ComplaintResponseReturnType>("ComplaintResponse");

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
      complaintId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      body: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
    }),
  });
