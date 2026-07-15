import type { Metadata } from "next";
import { ClassAuditContainer } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.classAudit");
  return { title: t.pageTitle };
}

export default function ClassAuditPage() {
  return <ClassAuditContainer />;
}
