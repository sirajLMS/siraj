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
      return TeacherPortalService.listAssignedStudents(userId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("teacherOwnProfile", t =>
  t.field({
    type: TeacherOwnProfilePothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return TeacherPortalService.getOwnProfile(userId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("teacherAssignedClasses", t =>
  t.field({
    type: TeacherAssignedClassesResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return TeacherPortalService.listAssignedClasses(userId, ctx.locale);
    },
  })
);
