import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { DstMigrationContainer } from "@/frontend/common/views/dashboard/tools/dst-migration/DstMigrationContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.dstMigration;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.SYSTEM_BULK_UPDATE_DST], async () => {
  return <DstMigrationContainer />;
});
