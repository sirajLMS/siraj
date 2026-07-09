import type { BaseContext } from "@/backend/graphql/gqlContext";
import { getBackendTranslations } from "@/backend/lib/intl";

export async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}
