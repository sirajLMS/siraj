import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { GeneralUserCreateContainer } from "@/frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.usersCreateUser;
  return { title: t.pageTitle };
}

export default withPageAuth([AppPermission.STAFF_CREATE], async () => {
  return <GeneralUserCreateContainer />;
});
