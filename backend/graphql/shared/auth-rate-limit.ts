import { GraphQLError } from "graphql";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import type { Translations } from "@/shared/locale";

export interface AuthRateLimitResult {
  readonly userId: string;
  readonly tErrors: Translations["errorsTranslations"];
}

export async function requireAuthWithRateLimit(ctx: BaseContext): Promise<AuthRateLimitResult> {
  const userId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  const rateLimitResult = await checkRateLimit(ctx.ipAddress ?? "[unknown]", authRateLimiter);
  if (!rateLimitResult.success) {
    throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
      extensions: { code: "TOO_MANY_ATTEMPTS" },
    });
  }
  return { userId, tErrors };
}
