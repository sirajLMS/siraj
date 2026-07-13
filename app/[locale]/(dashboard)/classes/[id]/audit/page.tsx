import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClassAuditContainer } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.classAudit" });
  return { title: t("pageTitle") };
}

export default function ClassAuditPage() {
  return <ClassAuditContainer />;
}
