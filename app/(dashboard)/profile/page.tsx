import type { Metadata } from "next";
import { ProfileMode } from "@/backend/enum";
import { ProfilePageServer } from "@/frontend/common/views/dashboard/profile/__shared__/profilePageServer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).profileTranslations.base;
  return { title: t.pageTitle };
}

export default async function ProfilePage() {
  return <ProfilePageServer mode={ProfileMode.VIEW} />;
}
