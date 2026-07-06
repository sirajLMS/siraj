import { GraphQLError } from "graphql";
import { getBackendTranslations } from "@/backend/lib/intl";
import type { BaseContext } from "../gqlContext";

export async function requireNotImpersonating(ctx: BaseContext): Promise<void> {
  if (!ctx.isImpersonating) {
    return;
  }

  const t = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
  throw new GraphQLError(t("auth.impersonationNotAllowedDuringSession"), {
    extensions: { code: "FORBIDDEN" },
  });
}
