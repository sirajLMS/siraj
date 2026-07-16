import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  TeacherAssignedClassesResultPothosObject,
  TeacherAssignedStudentsResultPothosObject,
  TeacherOwnProfilePothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-portal.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";

gqlSchemaBuilder.queryField("teacherAssignedStudents", t =>
  t.field({
    type: TeacherAssignedStudentsResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return TeacherPortalService.listAssignedStudents(userId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("teacherOwnProfile", t =>
  t.field({
    type: TeacherOwnProfilePothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return TeacherPortalService.getOwnProfile(userId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("teacherAssignedClasses", t =>
  t.field({
    type: TeacherAssignedClassesResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return TeacherPortalService.listAssignedClasses(userId, tErrors);
    },
  })
);
