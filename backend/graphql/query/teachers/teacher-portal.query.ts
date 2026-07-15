import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  TeacherAssignedClassesResultPothosObject,
  TeacherAssignedStudentsResultPothosObject,
  TeacherOwnProfilePothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-portal.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { getBackendTranslations } from "@/backend/lib/intl";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";

gqlSchemaBuilder.queryField("teacherAssignedStudents", t =>
  t.field({
    type: TeacherAssignedStudentsResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = (await getBackendTranslations({
        locale: ctx.locale,
        namespace: "errors",
      })) as unknown as import("@/shared/locale/types/errors").ErrorsLabels;
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
      const tErrors = (await getBackendTranslations({
        locale: ctx.locale,
        namespace: "errors",
      })) as unknown as import("@/shared/locale/types/errors").ErrorsLabels;
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
      const tErrors = (await getBackendTranslations({
        locale: ctx.locale,
        namespace: "errors",
      })) as unknown as import("@/shared/locale/types/errors").ErrorsLabels;
      return TeacherPortalService.listAssignedClasses(userId, tErrors);
    },
  })
);
