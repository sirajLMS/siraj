import type { BaseContext } from "@/backend/graphql/gqlContext";

export async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tErrors = await ctx.t("errors");
    throw new Error(tErrors.unauthorized);
  }
  return ctx.user.id;
}
