import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminSuggestionsContainer } from "@/frontend/views/dashboard/suggestions/AdminSuggestionsContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.suggestions.admin" });
  return { title: t("pageTitle") };
}

export default function SuggestionsManagePage() {
  return <AdminSuggestionsContainer />;
}
