import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { SubjectsContainer } from "@/frontend/common/views/dashboard/subjects/home/SubjectsContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.subjects");
  return { title: t.pageTitle };
}

export default async function SubjectsPage({ params }: { readonly params: Promise<{ readonly locale: string }> }) {
  const { locale } = await params;

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <SubjectsContainer />;
}
