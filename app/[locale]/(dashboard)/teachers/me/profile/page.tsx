import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { redirect } from "@/shared/i18n";

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function TeacherMeProfileRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  redirect({ href: "/profile", locale });
}
