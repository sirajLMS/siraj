import type { Metadata } from "next";
import { cache } from "react";
import { AppPermission } from "@/backend/enum";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { StudentsContainer } from "@/frontend/common/views/dashboard/admin/parents/students/StudentsContainer";
import { ParentStudentsContainer } from "@/frontend/common/views/dashboard/parent/students/ParentStudentsContainer";
import { TeacherStudentsContainer } from "@/frontend/common/views/dashboard/teachers/students/TeacherStudentsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentDirectory;
  return { title: t.pageTitle };
}

type StudentsAudience = "parent" | "teacher" | "admin";

const resolveStudentsAudience = cache(
  async (userId: string, permissionContext: UserPermissionContext | null): Promise<StudentsAudience> => {
    const { permissions } = await getCurrentUser(userId, permissionContext);

    if (
      permissions.includes(AppPermission.PARENT_VIEW_STUDENTS) &&
      !permissions.includes(AppPermission.STUDENTS_LIST)
    ) {
      return "parent";
    }

    if (
      permissions.includes(AppPermission.TEACHER_VIEW_STUDENTS) &&
      !permissions.includes(AppPermission.STUDENTS_LIST)
    ) {
      return "teacher";
    }

    return "admin";
  }
);

export default async function StudentsPage() {
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  const locale = await getLocale();
  const audience = await resolveStudentsAudience(userId, context);

  await requirePermissionForPage(
    userId,
    [AppPermission.PARENT_VIEW_STUDENTS, AppPermission.TEACHER_VIEW_STUDENTS, AppPermission.STUDENTS_LIST],
    locale,
    context
  );

  switch (audience) {
    case "parent":
      return <ParentStudentsContainer />;
    case "teacher":
      return <TeacherStudentsContainer />;
    default:
      return <StudentsContainer />;
  }
}
