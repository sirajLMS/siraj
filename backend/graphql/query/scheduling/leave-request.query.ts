import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { LeaveRequestPothosObject } from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils";
import { LeaveRequestService } from "@/backend/services";
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
