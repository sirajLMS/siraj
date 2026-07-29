import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { isUsersDirectoryEnabled } from "@/backend/lib/features/is-users-directory-enabled";
import {
  getStudentsPagePermissions,
  resolveStudentsPageAudience,
} from "@/app/(dashboard)/lib/resolve-students-page-audience";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { StudentsContainer } from "@/frontend/common/views/dashboard/admin/parents/students/StudentsContainer";
import { ParentStudentsContainer } from "@/frontend/common/views/dashboard/parent/students/ParentStudentsContainer";
import { TeacherStudentsContainer } from "@/frontend/common/views/dashboard/teachers/students/TeacherStudentsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

async function resolveAudienceMetadataTitle(locale: string): Promise<string> {
  const { userId, context } = await getServerUserContext();
  if (!userId || !context) {
    const t = getTranslations(locale).dashboardTranslations.studentDirectory;
    return t.pageTitle;
  }

  const audience = resolveStudentsPageAudience(context);
  const translations = getTranslations(locale).dashboardTranslations;

  if (audience === "teacher") {
    return translations.teacherStudents.pageTitle;
  }
  if (audience === "parent") {
    return translations.parentStudents.pageTitle;
  }

  return translations.studentDirectory.pageTitle;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: await resolveAudienceMetadataTitle(locale) };
}

export default async function StudentsPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  await requirePermissionForPage(userId, getStudentsPagePermissions(), locale, context);

  const audience = context ? resolveStudentsPageAudience(context) : null;

  if (await isUsersDirectoryEnabled() && audience === "admin") {
    redirect("/users?tab=students");
  }

  if (audience === "teacher") {
    return <TeacherStudentsContainer />;
  }
  if (audience === "parent") {
    return <ParentStudentsContainer />;
  }

  return <StudentsContainer />;
}
