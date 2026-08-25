// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ComplaintFilePothosObject,
  ComplaintQueueFilterPothosObject,
  ComplaintQueueResultPothosObject,
  normalizeComplaint,
  ParentComplaintsResultPothosObject,
} from "@/backend/graphql/pothos/complaints/complaint.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ComplaintService } from "@/backend/services";
import type { ComplaintQueueResult, ParentComplaintPaginatedResult } from "@/backend/types";

gqlSchemaBuilder.queryField("parentComplaints", t =>
  t.field({
    type: ParentComplaintsResultPothosObject,
    authScopes: { loggedIn: true },
    description: "Returns the authenticated parent's complaint history with pagination.",
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx): Promise<ParentComplaintPaginatedResult> => {
      const userId = await requireAuth(ctx);

      const pagination = parsePaginationArgs(args.paginationArgs);

      const result = await ComplaintService.getParentComplaints(userId, pagination, ctx.locale);

      return {
        id: result.id,
        complaints: result.complaints.map(normalizeComplaint),
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
    },
  })
);

gqlSchemaBuilder.queryField("adminComplaintQueue", t =>
  t.field({
    type: ComplaintQueueResultPothosObject,
    authScopes: { permission: AppPermission.COMPLAINTS_LIST },
    description: "Returns the paginated admin complaint queue with metrics.",
    args: {
      filter: t.arg({ type: ComplaintQueueFilterPothosObject, required: true }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx): Promise<ComplaintQueueResult> => {
      const userId = await requireAuth(ctx);

      const paginationArgs = parsePaginationArgs(args.paginationArgs);

      const result = await ComplaintService.getQueueWithMetricsPaginated(
        userId,
        {
          status: args.filter.status ?? null,
          search: args.filter.search ?? null,
        },
        paginationArgs,
        ctx.locale
      );

      return {
        id: result.id,
        complaints: result.rows.map(normalizeComplaint),
        metrics: {
          id: result.metrics.id,
          unanswered: result.metrics.unanswered,
          answered: result.metrics.answered,
          avgResolutionHours: result.metrics.avgResolutionHours,
          avgResolutionTime: null,
          totalCount: result.metrics.totalCount,
        },
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
    },
  })
);

gqlSchemaBuilder.queryField("complaintFiles", t =>
  t.field({
    type: [ComplaintFilePothosObject],
    authScopes: { loggedIn: true },
    description: "Returns file attachments for a specific complaint. Accessible by the owning parent or admins.",
    args: {
      complaintId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return await ComplaintService.getComplaintFiles(userId, args.complaintId, ctx.locale);
    },
  })
);
