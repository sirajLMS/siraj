// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { LeaveRequestPothosObject } from "@/backend/graphql/pothos/scheduling/leave-request.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { LeaveRequestService } from "@/backend/services/leave-request/leave-request.service";
import type { LeaveRequestSelectType } from "@/backend/types";

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
