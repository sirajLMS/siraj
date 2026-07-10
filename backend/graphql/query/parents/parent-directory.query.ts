import type { ParentStatus } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ParentDirectoryPothosObject } from "@/backend/graphql/pothos/parents/parent-directory.pothos";
import { ParentStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ParentDirectoryService } from "@/backend/services/parent/parent-directory.service";
import { PaginationArgs } from "@/backend/types";

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
        args.statusFilter ?? null,
        ctx.locale
      );
    },
  })
);
