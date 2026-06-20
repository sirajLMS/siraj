import { StaffDirectoryService } from "@/backend/services/teacher/staff-directory.service";
import { TeacherService } from "@/backend/services/teacher/teacher.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
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
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      return await StaffDirectoryService.getDirectory(
        ctx.user?.id || "",
        {
          search: args.search ?? undefined,
          limit: args.limit ?? undefined,
          offset: args.offset ?? undefined,
        },
        ctx.locale
      );
    },
  })
);
