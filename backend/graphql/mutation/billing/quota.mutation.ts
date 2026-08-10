import { GraphQLError } from "graphql";

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  QuotaPothosObject,
  QuotaSubmitInputPothosRef,
  QuotaUpdateInputPothosRef,
} from "@/backend/graphql/pothos/billing/quota.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  DomainError,
  ForbiddenError,
  NotFoundError,
  QuotaAlreadyDeletedError,
  QuotaNotFoundError,
} from "@/backend/lib/errors";
import { QuotaService } from "@/backend/services/billing/quota.service";
import type { QuotaUpdateInput } from "@/backend/types";

export function mapQuotaErrorToGraphQLError(error: unknown): GraphQLError {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (error instanceof ForbiddenError) {
    return new GraphQLError(message, { extensions: { code: "FORBIDDEN" } });
  }

  if (error instanceof NotFoundError || error instanceof QuotaNotFoundError) {
    return new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });
  }

  if (error instanceof QuotaAlreadyDeletedError) {
    return new GraphQLError(message, { extensions: { code: "CONFLICT" } });
  }

  if (error instanceof Error && /Concurrency conflict|version mismatch/.test(error.message)) {
    return new GraphQLError(message, { extensions: { code: "CONFLICT" } });
  }

  if (error instanceof DomainError && error.code === "CONCURRENCY_CONFLICT") {
    return new GraphQLError(message, { extensions: { code: "CONFLICT" } });
  }

  return new GraphQLError(message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
}

gqlSchemaBuilder.mutationField("createQuota", t =>
  t.field({
    type: QuotaPothosObject,
    description: "Create a new quota allocation for a student",
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: QuotaSubmitInputPothosRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      // V3-012: Permission check is enforced by QuotaService.createQuota
      // (see requirePermission in quota.service.ts). No duplicate check here.
      // V3-070: Map service-layer errors to proper GraphQL error codes.
      try {
        return await QuotaService.createQuota(args.input, actorUserId, ctx.locale);
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("updateQuota", t =>
  t.field({
    type: QuotaPothosObject,
    description: "Update an existing student quota allocation",
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: QuotaUpdateInputPothosRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      // V3-012: Permission check is enforced by QuotaService.updateQuota.
      // V3-070: Map service-layer errors to proper GraphQL error codes.
      try {
        const input: QuotaUpdateInput = {
          ...args.input,
          name: args.input.name ?? undefined,
          status: args.input.status ?? undefined,
          priority: args.input.priority ?? undefined,
          version: args.input.version ?? undefined,
        };
        return await QuotaService.updateQuota(args.id, input, actorUserId, ctx.locale);
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("deleteQuota", t =>
  t.field({
    type: QuotaPothosObject,
    description: "Soft delete a student quota allocation",
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      // V3-012: Permission check is enforced by QuotaService.deleteQuota.
      // V3-070: Map service-layer errors to proper GraphQL error codes.
      try {
        return await QuotaService.deleteQuota(args.id, actorUserId, ctx.locale);
      } catch (error) {
        throw mapQuotaErrorToGraphQLError(error);
      }
    },
  })
);
