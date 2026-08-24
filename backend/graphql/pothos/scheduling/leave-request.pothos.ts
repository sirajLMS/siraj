import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { LeaveRequestService } from "@/backend/services/leave-request/leave-request.service";
import type { LeaveRequestSelectType } from "@/backend/types";

// ---------------------------------------------------------------------------
// Object type — single canonical, includes `id` (Apollo cache normalization).
// Enums (LeaveRequesterType, LeaveRequestType, LeaveRequestStatus) are
// registered in shared/enum.pothos.ts to avoid circular imports.
// ---------------------------------------------------------------------------

const LeaveRequestRef = gqlSchemaBuilder.objectRef<LeaveRequestSelectType>("LeaveRequest");

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
  .inputRef<{
    classInstanceId: string;
    proposedStartAt: Date;
    reason?: string | null;
  }>("RequestSessionDelayInput")
  .implement({
    description: "Input for a student/parent requesting a session delay (reschedule).",
    fields: t => ({
      classInstanceId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      proposedStartAt: t.field({ type: "DateTime", required: true }),
      reason: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
    }),
  });

export const RequestSessionCancelInputPothosObject = gqlSchemaBuilder
  .inputRef<{
    classInstanceId: string;
    reason?: string | null;
  }>("RequestSessionCancelInput")
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

gqlSchemaBuilder.mutationField("requestSessionDelay", t =>
  t.field({
    type: LeaveRequestPothosObject,
    authScopes: { permission: AppPermission.SESSION_SELF_DELAY },
    description: "Student/parent requests a delay (reschedule) for an upcoming session.",
    args: {
      input: t.arg({ type: RequestSessionDelayInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx): Promise<LeaveRequestSelectType> => {
      const userId = await requireAuth(ctx);
      return LeaveRequestService.createStudentDelayRequest(
        userId,
        args.input.classInstanceId,
        args.input.proposedStartAt,
        args.input.reason ?? null,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("requestSessionCancel", t =>
  t.field({
    type: LeaveRequestPothosObject,
    authScopes: { permission: AppPermission.SESSION_SELF_CANCEL },
    description: "Student/parent requests a cancellation for an upcoming session.",
    args: {
      input: t.arg({ type: RequestSessionCancelInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx): Promise<LeaveRequestSelectType> => {
      const userId = await requireAuth(ctx);
      return LeaveRequestService.createStudentCancelRequest(
        userId,
        args.input.classInstanceId,
        args.input.reason ?? null,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("rejectLeaveRequest", t =>
  t.field({
    type: LeaveRequestPothosObject,
    authScopes: { permission: AppPermission.SESSION_RESCHEDULE },
    description: "Supervisor/admin rejects a pending leave request.",
    args: {
      requestId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx): Promise<LeaveRequestSelectType> => {
      const userId = await requireAuth(ctx);
      return LeaveRequestService.rejectRequest(userId, args.requestId, ctx.locale);
    },
  })
);

// ---------------------------------------------------------------------------
// Query — my leave requests (student/parent view)
// ---------------------------------------------------------------------------

gqlSchemaBuilder.queryField("myLeaveRequests", t =>
  t.field({
    type: [LeaveRequestPothosObject],
    authScopes: { permission: AppPermission.SESSION_SELF_DELAY },
    description: "Returns the authenticated user's own leave requests (delay/cancel).",
    resolve: async (_root, _args, ctx): Promise<LeaveRequestSelectType[]> => {
      const userId = await requireAuth(ctx);
      return LeaveRequestService.getMyRequests(userId, ctx.locale);
    },
  })
);
