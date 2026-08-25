// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ComplaintResponsePothosObject,
  RespondToComplaintInputPothosObject,
} from "@/backend/graphql/pothos/complaints/complaintResponses.pothos";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import { ComplaintResponseService } from "@/backend/services";

gqlSchemaBuilder.mutationField("respondToComplaint", t =>
  t.field({
    type: ComplaintResponsePothosObject,
    authScopes: { permission: AppPermission.COMPLAINTS_RESPOND },
    description: "Creates a response to an existing complaint (admin only).",
    args: {
      input: t.arg({ type: RespondToComplaintInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }

      const tErrors = ctx.t().errorsTranslations;
      const rateLimitResult = await checkRateLimit(ctx.ipAddress ?? "[unknown]", authRateLimiter);
      if (!rateLimitResult.success) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      const response = await ComplaintResponseService.respondToComplaint(
        { complaintId: args.input.complaintId ?? undefined, body: args.input.body },
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
