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

/**
 * Resolves the common authenticated resolver context: the acting user id and
 * the locale-bound error translations for the request. Resolvers that need
 * both values inline (rather than a wrapper) use this directly.
 */
export async function resolveAuthCtx(ctx: BaseContext): Promise<{ actorUserId: string; tErrors: ErrorsLabels }> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  return { actorUserId, tErrors };
}
