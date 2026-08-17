import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { redirect } from "@/shared/i18n/routing";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.studentQuota;
  return { title: t.pageTitle };
}

export default withPageAuth<{ params: Promise<{ id: string }> }>(
  [AppPermission.QUOTAS_VIEW],
  async (_auth, { params }) => {
    const { id } = await params;
    redirect({ href: `/students/${id}/profile?tab=quota` });
    return undefined;
  }
);
