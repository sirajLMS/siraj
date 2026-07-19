import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { TeacherDirectoryPothosObject } from "@/backend/graphql/pothos/teachers/staff-directory.pothos";
import { TeacherSimplePothosObject } from "@/backend/graphql/pothos/teachers/teacher.pothos";
import { StaffDirectoryService } from "@/backend/services/teacher/staff-directory.service";
import { TeacherService } from "@/backend/services/teacher/teacher.service";
import { PaginationArgs } from "@/backend/types";

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

      return await StaffDirectoryService.getDirectory(
        ctx.user?.id || "",
        pagination,
        args.search ?? undefined,
        ctx.locale
      );
    },
  })
);
