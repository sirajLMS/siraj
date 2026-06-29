import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { SubjectsContainer } from "@/frontend/views/dashboard/subjects/home/SubjectsContainer";
import { redirect } from "@/shared/i18n/routing";

export default async function SubjectsPage({ params }: { readonly params: Promise<{ readonly locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <SubjectsContainer />;
}
