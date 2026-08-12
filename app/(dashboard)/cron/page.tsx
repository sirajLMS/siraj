import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { CronPageContainer } from "@/frontend/common/views/dashboard/cron/CronPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.coreNav;
  return { title: t.cron };
}

export default withPageAuth([AppPermission.CRON_MANAGE], async () => {
  return <CronPageContainer />;
});
