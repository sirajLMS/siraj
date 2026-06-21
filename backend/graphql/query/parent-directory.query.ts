import { getBackendTranslations } from "@/backend/lib/intl";
import { ParentDirectoryService } from "@/backend/services/parent/parent-directory.service";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ParentDirectoryPothosObject } from "../pothos/parent-directory.pothos";

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

gqlSchemaBuilder.queryField("parentDirectory", t =>
  t.field({
    type: ParentDirectoryPothosObject,
    args: {
      search: t.arg.string(),
      limit: t.arg.int({ defaultValue: 50 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ParentDirectoryService.getParentDirectory(
        userId,
        args.search ?? null,
        args.limit ?? 50,
        args.offset ?? 0,
        ctx.locale
      );
    },
  })
);
