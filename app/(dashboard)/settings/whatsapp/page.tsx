import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { resolveEnvConfigMany } from "@/backend/services/system";
import { WhatsappSettingsContainer } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappSettingsContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.coreNav;
  return { title: t.whatsappSettings };
}

export default withPageAuth([AppPermission.WHATSAPP_VIEW], async () => {
  // Embedded Signup launch config is resolved server-side from env-config so
  // the client never supplies `config_id` (it only ever posts back the ES
  // authorization code + asset IDs).
  const { WHATSAPP_ES_CONFIG_ID: esConfigId, WHATSAPP_APP_ID: esAppId } = await resolveEnvConfigMany([
    "WHATSAPP_ES_CONFIG_ID",
    "WHATSAPP_APP_ID",
  ]);
  return <WhatsappSettingsContainer esConfigId={esConfigId ?? null} esAppId={esAppId ?? null} />;
});
