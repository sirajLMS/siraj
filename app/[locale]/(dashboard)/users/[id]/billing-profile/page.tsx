import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUserPageTitle } from "@/backend/lib/titles/cached-page-title";
import { UserBillingProfileContainer } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer";

interface BillingProfilePageProps {
  readonly params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: BillingProfilePageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.billing" });
  const userName = await getUserPageTitle(id);
  if (userName) {
    return { title: `${userName} — ${t("billingProfileTitle")}` };
  }
  return { title: t("billingProfileTitle") };
}

export default async function BillingProfilePage({ params }: Readonly<BillingProfilePageProps>) {
  const { id } = await params;
  return <UserBillingProfileContainer userId={id} />;
}
