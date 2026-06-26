import { StaffDirectoryService } from "@/backend/services/teacher/staff-directory.service";
import { TeacherService } from "@/backend/services/teacher/teacher.service";
import { PaginationArgs } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PaginationArgsObject } from "../pothos/pagination.objects";
import { TeacherDirectoryPothosObject } from "../pothos/staff-directory.pothos";
import { TeacherSimplePothosObject } from "../pothos/teacher.pothos";

gqlSchemaBuilder.queryField("teachers", t =>
  t.field({
    type: [TeacherSimplePothosObject],
    args: {
      search: t.arg.string({ required: true }),
      limit: t.arg.int({ required: true }),
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
      search: t.arg.string({ required: false }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    authScopes: { loggedIn: true },
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
