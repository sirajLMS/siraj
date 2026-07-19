import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StaffDirectoryAutocompleteRowPothosObject } from "@/backend/graphql/pothos/teachers/staff-directory.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ManagerDirectoryService } from "@/backend/services/staff/manager-directory.service";

const STAFF_DIRECTORY_DEFAULT_LIMIT = 20;
const STAFF_DIRECTORY_MAX_LIMIT = 100;

gqlSchemaBuilder.queryField("staffDirectory", t =>
  t.field({
    type: [StaffDirectoryAutocompleteRowPothosObject],
    nullable: false,
    authScopes: { permission: AppPermission.STAFF_VIEW_DIRECTORY },
    args: {
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      limit: t.arg.int({
        required: false,
        directives: { constraint: { min: 1, max: STAFF_DIRECTORY_MAX_LIMIT } },
      }),
      permissionGroupFilter: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const limit = Math.min(args.limit ?? STAFF_DIRECTORY_DEFAULT_LIMIT, STAFF_DIRECTORY_MAX_LIMIT);
      const search = args.search?.trim() ?? null;
      const permissionGroupFilter = args.permissionGroupFilter ?? null;

      return ManagerDirectoryService.getStaffDirectory(
        userId,
        search,
        limit,
        permissionGroupFilter,
        ctx.locale
      );
    },
    description: "Lightweight staff list for autocomplete (id, name, avatarUrl, email).",
  })
);
