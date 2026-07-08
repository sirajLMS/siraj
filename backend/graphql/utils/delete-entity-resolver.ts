import type { BaseContext } from "../gqlContext";
import { requireAuth } from "../utils/requireAuth";

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
  deleteFn: (userId: string, entityId: string, locale?: string) => Promise<unknown>
): Promise<boolean> {
  const userId = await requireAuth(ctx);
  await deleteFn(userId, entityId, ctx.locale);
  return true;
}
