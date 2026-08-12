import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  TeacherDuePothosObject,
  TeacherPendingDuesSummaryPothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-due.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { TeacherDueService } from "@/backend/services";

gqlSchemaBuilder.queryField("teacherPendingDues", t =>
  t.field({
    type: [TeacherDuePothosObject],
    description: "Get pending (unpaid) teacher due entries, optionally filtered by teacher",
    authScopes: { permission: AppPermission.TEACHER_DUES_VIEW },
    args: {
      teacherId: t.arg.id({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return TeacherDueService.getPendingDues(actorUserId, args.teacherId ?? undefined, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("teacherPendingDuesSummary", t =>
  t.field({
    type: TeacherPendingDuesSummaryPothosObject,
    description: "Get summary of pending teacher dues (count + total amount)",
    authScopes: { permission: AppPermission.TEACHER_DUES_VIEW },
    resolve: async (_root, _args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return TeacherDueService.getPendingDuesSummary(actorUserId, ctx.locale);
    },
  })
);
