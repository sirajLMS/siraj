// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  LeaveRequestPothosObject,
  RequestSessionCancelInputPothosObject,
  RequestSessionDelayInputPothosObject,
} from "@/backend/graphql/pothos/scheduling/leave-request.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { LeaveRequestService } from "@/backend/services/leave-request/leave-request.service";
import type { LeaveRequestSelectType } from "@/backend/types";

gqlSchemaBuilder.mutationField("requestSessionDelay", t =>
  t.field({
    type: LeaveRequestPothosObject,
    authScopes: { permission: AppPermission.SESSION_SELF_DELAY },
    description: "Student/parent requests a delay (reschedule) for an upcoming session.",
    args: {
      input: t.arg({ type: RequestSessionDelayInputPothosObject, required: true }),
    },
    resolve: async (_root, { input }, ctx): Promise<LeaveRequestSelectType> => {
      const { classInstanceId, proposedStartAt, reason } = input;
      const userId = await requireAuth(ctx);
      return LeaveRequestService.createStudentDelayRequest(
        userId,
        classInstanceId,
        proposedStartAt,
        reason ?? null,
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
      const reason = args.input.reason ?? null;
      return LeaveRequestService.createStudentCancelRequest(userId, args.input.classInstanceId, reason, ctx.locale);
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
