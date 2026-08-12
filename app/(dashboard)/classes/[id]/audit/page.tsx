import type { Metadata } from "next";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { ClassAuditContainer } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer";

export async function generateMetadata(): Promise<Metadata> {
  return buildTranslatedMetadata(t => t.dashboardTranslations.classAudit.pageTitle);
}

export default function ClassAuditPage() {
  return <ClassAuditContainer />;
}
