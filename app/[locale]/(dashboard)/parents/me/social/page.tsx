import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentSocialContainer } from "@/frontend/common/views/dashboard/parent/social/ParentSocialContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.parentSocial" });
  return { title: t("pageTitle") };
}

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ParentMeSocialPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <ParentSocialContainer />;
}
