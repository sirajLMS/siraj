import type { Metadata } from "next";
import { AdminSuggestionsContainer } from "@/frontend/common/views/dashboard/suggestions/AdminSuggestionsContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.suggestions;
  return { title: t.admin.pageTitle };
}

export default function SuggestionsManagePage() {
  return <AdminSuggestionsContainer />;
}
