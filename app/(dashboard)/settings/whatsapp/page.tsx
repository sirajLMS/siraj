import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { WhatsappSettingsContainer } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappSettingsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.coreNav;
  return { title: t.whatsappSettings };
}

export default withPageAuth([AppPermission.WHATSAPP_VIEW], async () => {
  return <WhatsappSettingsContainer />;
});
