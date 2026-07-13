import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { TeacherDuePothosObject } from "@/backend/graphql/pothos/teachers/teacher-due.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";

gqlSchemaBuilder.queryField("teacherPendingDues", t =>
  t.field({
    type: [TeacherDuePothosObject],
    description: "Get pending (unpaid) teacher due entries, optionally filtered by teacher",
    authScopes: { loggedIn: true },
    args: {
      teacherId: t.arg.id({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return TeacherDueService.getPendingDues(actorUserId, args.teacherId ?? undefined, ctx.locale);
    },
  })
);
