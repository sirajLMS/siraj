import type { BaseContext } from "@/backend/graphql/gqlContext";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

/**
 * Shared resolver body for "delete entity by id" Boolean mutations.
 *
 * Handles the common pattern: authenticate, invoke a delete service with the
 * entity id, propagate locale, and return `true`. Eliminates duplication
 * across mutation field definitions that share this exact shape.
 */
export async function deleteEntityResolver(
  ctx: BaseContext,
  entityId: string,
  deleteFn: (userId: string, entityId: string, tErrors: ErrorsLabels) => Promise<unknown>
): Promise<boolean> {
  const userId = await requireAuth(ctx);
  const tErrors = await ctx.t("errors");
  await deleteFn(userId, entityId, tErrors);
  return true;
}
