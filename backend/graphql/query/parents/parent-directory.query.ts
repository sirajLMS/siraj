import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ParentDirectoryAutocompleteRowPothosObject,
  ParentDirectoryPothosObject,
} from "@/backend/graphql/pothos/parents/parent-directory.pothos";
import { ParentStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ParentDirectoryService } from "@/backend/services";

const PARENTS_DIRECTORY_DEFAULT_LIMIT = 20;
const PARENTS_DIRECTORY_MAX_LIMIT = 100;

gqlSchemaBuilder.queryField("parentDirectory", t =>
  t.field({
    type: ParentDirectoryPothosObject,
    args: {
      search: t.arg.string(),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      lifecycleStatusFilter: t.arg({ type: ParentStatusPothosEnum, required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);

      const pagination = parsePaginationArgs(args.paginationArgs);

      return ParentDirectoryService.getParentDirectory(
        userId,
        args.search ?? null,
        pagination,
        args.lifecycleStatusFilter ?? null,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("parentsDirectory", t =>
  t.field({
    type: [ParentDirectoryAutocompleteRowPothosObject],
    nullable: false,
    authScopes: { loggedIn: true },
    args: {
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      limit: t.arg.int({
        required: false,
        directives: { constraint: { min: 1, max: PARENTS_DIRECTORY_MAX_LIMIT } },
      }),
    },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const limit = Math.min(args.limit ?? PARENTS_DIRECTORY_DEFAULT_LIMIT, PARENTS_DIRECTORY_MAX_LIMIT);
      const search = args.search?.trim() ?? null;

      return ParentDirectoryService.getParentsDirectory(userId, search, limit, ctx.locale);
    },
    description: "Lightweight parent list for autocomplete (id, name, avatarUrl).",
  })
);
