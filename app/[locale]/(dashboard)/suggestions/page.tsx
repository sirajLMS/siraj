import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentSuggestionsContainer } from "@/frontend/views/dashboard/suggestions/ParentSuggestionsContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.suggestions.parent" });
  return { title: t("pageTitle") };
}

export default function SuggestionsPage() {
  return <ParentSuggestionsContainer />;
}
