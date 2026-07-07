import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib";
import { ProfileService } from "@/backend/services";
import { redirect } from "@/shared/i18n";

interface PageProps {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}

export default async function TeacherProfileRedirectPage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  const targetUserId = await ProfileService.resolveUserIdForTeacherId(id);
  if (!targetUserId) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  redirect({ href: `/users/${targetUserId}/profile`, locale });
}
