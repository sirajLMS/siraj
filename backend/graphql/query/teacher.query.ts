import { TeacherService } from "@/backend/services/teacher/teacher.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
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
      return await TeacherService.searchTeachers(
        ctx.user?.id,
        args.search,
        args.limit,
        ctx.locale
      );
    },
  })
);
