import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).commonTranslations;
  return { title: t.title };
}

export default async function RootPage() {
  const { userId, context } = await getServerUserContext();
  if (userId && context) {
    redirect("/dashboard");
  }
  await redirectToLogin();
}
