// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission, ComplaintCategory, ComplaintStatus } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ComplaintPothosObject,
  normalizeComplaint,
  SubmitComplaintInputPothosObject,
} from "@/backend/graphql/pothos/complaints/complaint.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { isComplaintCategory, isComplaintStatus } from "@/backend/lib";
import { ComplaintService } from "@/backend/services";
import type { ComplaintReturnType, ComplaintSelectType } from "@/backend/types";

gqlSchemaBuilder.mutationField("submitComplaint", t =>
  t.field({
    type: ComplaintPothosObject,
    authScopes: { loggedIn: true },
    description: "Submits a new complaint from the authenticated parent.",
    args: {
      input: t.arg({ type: SubmitComplaintInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx): Promise<ComplaintReturnType> => {
      const userId = await requireAuth(ctx);

      const created: ComplaintSelectType = await ComplaintService.submitComplaint(
        userId,
        {
          studentId: args.input.studentId ?? null,
          category: args.input.category,
          submitterEmail: args.input.submitterEmail,
          body: args.input.body,
          files: args.input.files ?? [],
        },
        ctx.locale
      );

      const category = isComplaintCategory(created.category) ? created.category : ComplaintCategory.OTHER;
      const status = isComplaintStatus(created.status) ? created.status : ComplaintStatus.UNANSWERED;

      return normalizeComplaint({
        id: created.id,
        category,
        body: created.body,
        status,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        parentName: null,
        studentName: null,
        responseCount: 0,
        responses: [],
        files: [],
      });
    },
  })
);

gqlSchemaBuilder.mutationField("deleteComplaint", t =>
  t.field({
    type: "Boolean",
    authScopes: { permission: AppPermission.COMPLAINTS_DELETE },
    description: "Soft-deletes a complaint (admin only). Returns true on success.",
    args: {
      complaintId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      await ComplaintService.deleteComplaint(userId, args.complaintId, ctx.locale);

      return true;
    },
  })
);
