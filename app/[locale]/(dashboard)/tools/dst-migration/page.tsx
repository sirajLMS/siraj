import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DstMigrationContainer } from "@/frontend/common/views/dashboard/tools/dst-migration/DstMigrationContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.dstMigration" });
  return { title: t("pageTitle") };
}

export default function DstMigrationPage() {
  return <DstMigrationContainer />;
}
