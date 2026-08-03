import type { BaseContext } from "@/backend/graphql/gqlContext";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Wraps a resolver body that needs an authenticated user, returning the result
 * directly. Handles the common pattern: authenticate, extract locale-bound
 * error translations, delegate to the inner function.
 */
export function withAuthResult<TArgs, TResult>(
  fn: (actorUserId: string, args: TArgs, tErrors: ErrorsLabels, locale: string) => Promise<TResult>
) {
  return async (_parent: unknown, args: TArgs, ctx: BaseContext): Promise<TResult> => {
    const actorUserId = await requireAuth(ctx);
    const tErrors = ctx.t().errorsTranslations;
    return fn(actorUserId, args, tErrors, ctx.locale);
  };
}

/**
 * Wraps a resolver body that performs a write operation and always returns
 * `true` on success. Handles the common pattern: authenticate, extract
 * locale-bound error translations, delegate to the inner function, return `true`.
 */
export function withAuthVoid<TArgs>(
  fn: (actorUserId: string, args: TArgs, tErrors: ErrorsLabels, locale: string) => Promise<unknown>
) {
  return async (_parent: unknown, args: TArgs, ctx: BaseContext): Promise<boolean> => {
    const actorUserId = await requireAuth(ctx);
    const tErrors = ctx.t().errorsTranslations;
    await fn(actorUserId, args, tErrors, ctx.locale);
    return true;
  };
}
