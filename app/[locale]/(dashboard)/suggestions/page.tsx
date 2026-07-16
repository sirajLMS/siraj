import type { Metadata } from "next";
import { ParentSuggestionsContainer } from "@/frontend/common/views/dashboard/suggestions/ParentSuggestionsContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.suggestions;
  return { title: t.parent.pageTitle };
}

export default function SuggestionsPage() {
  return <ParentSuggestionsContainer />;
}
