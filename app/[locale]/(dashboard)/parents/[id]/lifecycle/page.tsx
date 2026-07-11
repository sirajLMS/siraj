import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentLifecycleContainer } from "@/frontend/views/dashboard/parents/lifecycle/ParentLifecycleContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.parentLifecycle" });
  return { title: t("pageTitle") };
}

export default function ParentLifecyclePage() {
  return <ParentLifecycleContainer />;
}
