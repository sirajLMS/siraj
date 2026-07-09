import { GraphQLError } from "graphql";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { getBackendTranslations } from "@/backend/lib/intl";

export async function requireNotImpersonating(ctx: BaseContext): Promise<void> {
  if (!ctx.isImpersonating) {
    return;
  }

  const t = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
  throw new GraphQLError(t("auth.impersonationNotAllowedDuringSession"), {
    extensions: { code: "FORBIDDEN" },
  });
}
