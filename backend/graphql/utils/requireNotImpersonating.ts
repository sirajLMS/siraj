import { GraphQLError } from "graphql";
import type { BaseContext } from "@/backend/graphql/gqlContext";

export async function requireNotImpersonating(ctx: BaseContext): Promise<void> {
  if (!ctx.isImpersonating) {
    return;
  }

  const tErrors = ctx.t().errorsTranslations;
  throw new GraphQLError(tErrors.auth.impersonationNotAllowedDuringSession, {
    extensions: { code: "FORBIDDEN" },
  });
}
