import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import type { UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { StudentsContainer } from "@/frontend/views/dashboard/admin/parents/students/StudentsContainer";
import { ParentStudentsContainer } from "@/frontend/views/dashboard/parent/students/ParentStudentsContainer";
import { TeacherStudentsContainer } from "@/frontend/views/dashboard/teachers/students/TeacherStudentsContainer";
import { redirect } from "@/shared/i18n/routing";
import { AppPermission } from "@/shared/lib/enum";

export const metadata: Metadata = {
  title: "Your Students - Siraj LMS",
};

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
  setRequestLocale(locale);

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
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
