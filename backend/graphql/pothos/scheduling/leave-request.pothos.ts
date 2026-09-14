import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type {
  LeaveRequestSelectType,
  RequestSessionCancelInput,
  RequestSessionDelayInput,
} from "@/backend/types";

// ---------------------------------------------------------------------------
// Object type — single canonical, includes `id` (Apollo cache normalization).
// Enums (LeaveRequesterType, LeaveRequestType, LeaveRequestStatus) are
// registered in shared/enum.pothos.ts to avoid circular imports.
// ---------------------------------------------------------------------------

export const LeaveRequestRef = gqlSchemaBuilder.objectRef<LeaveRequestSelectType>("LeaveRequest");

export const LeaveRequestPothosObject = LeaveRequestRef.implement({
  description: "A self-service leave/delay/cancel request from a student or parent.",
  fields: t => ({
    id: t.exposeID("id"),
    classInstanceId: t.exposeID("classInstanceId"),
    requestedByUserId: t.exposeID("requestedByUserId"),
    requesterType: t.exposeString("requesterType"),
    requestType: t.exposeString("requestType", { nullable: true }),
    proposedStartAt: t.expose("proposedStartAt", { type: "DateTime", nullable: true }),
    reason: t.exposeString("reason", { nullable: true }),
    status: t.exposeString("status"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    processedAt: t.expose("processedAt", { type: "DateTime", nullable: true }),
    processedByUserId: t.exposeID("processedByUserId", { nullable: true }),
  }),
});

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export const RequestSessionDelayInputPothosObject = gqlSchemaBuilder
  .inputRef<RequestSessionDelayInput>("RequestSessionDelayInput")
  .implement({
    description: "Input for a student/parent requesting a session delay (reschedule).",
    fields: t => ({
      classInstanceId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      proposedStartAt: t.field({ type: "DateTime", required: true }),
      reason: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
    }),
  });

export const RequestSessionCancelInputPothosObject = gqlSchemaBuilder
  .inputRef<RequestSessionCancelInput>("RequestSessionCancelInput")
  .implement({
    description: "Input for a student/parent requesting a session cancellation.",
    fields: t => ({
      classInstanceId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      reason: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
    }),
  });

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Query — my leave requests (student/parent view)
// ---------------------------------------------------------------------------
