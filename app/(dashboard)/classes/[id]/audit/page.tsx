import type { Metadata } from "next";
import { ClassAuditContainer } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.classAudit;
  return { title: t.pageTitle };
}

export default function ClassAuditPage() {
  return <ClassAuditContainer />;
}
