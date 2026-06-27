import { getBackendTranslations } from "@/backend/lib/intl";
import { ParentDirectoryService } from "@/backend/services/parent/parent-directory.service";
import { PaginationArgs } from "@/backend/types";
import type { ParentStatus } from "@/shared/lib/enum";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ParentStatusPothosEnum } from "../pothos/enum.pothos";
import { PaginationArgsObject } from "../pothos/pagination.objects";
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
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      statusFilter: t.arg({ type: ParentStatusPothosEnum, required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);

      let pagination: PaginationArgs | null = null;
      if (args.paginationArgs) {
        pagination = new PaginationArgs({
          first: args.paginationArgs.first ?? null,
          skip: args.paginationArgs.skip ?? null,
          after: args.paginationArgs.after ?? null,
          before: args.paginationArgs.before ?? null,
          last: args.paginationArgs.last ?? null,
          page: args.paginationArgs.page ?? null,
          maxCount: args.paginationArgs.maxCount ?? null,
        });
      }

      return ParentDirectoryService.getParentDirectory(
        userId,
        args.search ?? null,
        pagination,
        (args.statusFilter as ParentStatus | undefined) ?? null,
        ctx.locale
      );
    },
  })
);
