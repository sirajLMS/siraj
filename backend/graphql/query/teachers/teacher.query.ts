import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { TeacherDirectoryPothosObject } from "@/backend/graphql/pothos/teachers/staff-directory.pothos";
import { TeacherSimplePothosObject } from "@/backend/graphql/pothos/teachers/teacher.pothos";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { StaffDirectoryService } from "@/backend/services/teacher/staff-directory.service";
import { TeacherService } from "@/backend/services/teacher/teacher.service";

gqlSchemaBuilder.queryField("teachers", t =>
  t.field({
    type: [TeacherSimplePothosObject],
    args: {
      search: t.arg.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
      limit: t.arg.int({ required: true, directives: { constraint: { max: 200 } } }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      return await TeacherService.searchTeachers(ctx.user?.id, args.search, args.limit, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("teacherDirectory", t =>
  t.field({
    type: TeacherDirectoryPothosObject,
    args: {
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    authScopes: (_parent, _args, ctx) =>
      ctx.isSuperAdmin ||
      ctx.permissions.includes(AppPermission.TEACHERS_LIST) ||
      ctx.permissions.includes(AppPermission.STAFF_VIEW_DIRECTORY),
    resolve: async (_parent, args, ctx) => {
      const pagination = parsePaginationArgs(args.paginationArgs);

      return await StaffDirectoryService.getDirectory(
        ctx.user?.id || "",
        pagination,
        args.search ?? undefined,
        ctx.locale
      );
    },
  })
);
