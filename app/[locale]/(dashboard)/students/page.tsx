import type { Metadata } from "next";
import { cache } from "react";
import { AppPermission } from "@/backend/enum";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { StudentsContainer } from "@/frontend/common/views/dashboard/admin/parents/students/StudentsContainer";
import { ParentStudentsContainer } from "@/frontend/common/views/dashboard/parent/students/ParentStudentsContainer";
import { TeacherStudentsContainer } from "@/frontend/common/views/dashboard/teachers/students/TeacherStudentsContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
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

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function StudentsPage({ params }: PageProps) {
  const { locale } = await params;

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  const audience = await resolveStudentsAudience(userId, context);

  switch (audience) {
    case "parent":
      return <ParentStudentsContainer />;
    case "teacher":
      return <TeacherStudentsContainer />;
    default:
      return <StudentsContainer />;
  }
}
