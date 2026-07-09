import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { SubjectsContainer } from "@/frontend/views/dashboard/subjects/home/SubjectsContainer";

export default async function SubjectsPage({ params }: { readonly params: Promise<{ readonly locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <SubjectsContainer />;
}
