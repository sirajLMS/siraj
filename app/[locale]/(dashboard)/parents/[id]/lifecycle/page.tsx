import type { Metadata } from "next";
import { ParentLifecycleContainer } from "@/frontend/common/views/dashboard/parents/lifecycle/ParentLifecycleContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.parentLifecycle;
  return { title: t.pageTitle };
}

export default function ParentLifecyclePage() {
  return <ParentLifecycleContainer />;
}
