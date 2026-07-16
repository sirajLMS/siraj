import type { Metadata } from "next";
import { DstMigrationContainer } from "@/frontend/common/views/dashboard/tools/dst-migration/DstMigrationContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.dstMigration;
  return { title: t.pageTitle };
}

export default function DstMigrationPage() {
  return <DstMigrationContainer />;
}
