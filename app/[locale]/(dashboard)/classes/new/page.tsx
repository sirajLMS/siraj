import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreateRecurringClassContainer } from "@/frontend/common/views/dashboard/classes/recurring/CreateRecurringClassContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.createRecurringClass" });
  return { title: t("pageTitle") };
}

export default function CreateRecurringClassPage() {
  return <CreateRecurringClassContainer />;
}
