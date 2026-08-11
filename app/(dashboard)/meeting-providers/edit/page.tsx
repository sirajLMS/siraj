import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { MeetingProviderFormContainer } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.meetingProviders;
  return { title: t.editTitle };
}

export default withPageAuth<{ readonly searchParams: Promise<{ readonly id?: string }> }>(
  [AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG],
  async (_auth, { searchParams }) => {
    const resolvedSearchParams = await searchParams;
    return <MeetingProviderFormContainer mode="edit" providerId={resolvedSearchParams.id ?? null} />;
  }
);
