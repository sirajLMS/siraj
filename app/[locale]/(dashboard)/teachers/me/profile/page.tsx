import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib";
import { redirect } from "@/shared/i18n";

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function TeacherMeProfileRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  redirect({ href: "/profile", locale });
}
