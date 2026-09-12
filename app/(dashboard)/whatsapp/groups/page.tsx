import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { WhatsappGroupsContainer } from "@/frontend/common/views/dashboard/whatsapp/groups";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).whatsappGroupsTranslations;
  return { title: t.title };
}

export default withPageAuth([AppPermission.WHATSAPP_GROUPS_VIEW], async () => <WhatsappGroupsContainer />);
