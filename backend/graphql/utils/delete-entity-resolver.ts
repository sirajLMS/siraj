import type { BaseContext } from "@/backend/graphql/gqlContext";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type { ErrorsLabels } from "@/shared/locale";

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
  const tErrors = ctx.t().errorsTranslations;
  await deleteFn(userId, entityId, tErrors);
  return true;
}
