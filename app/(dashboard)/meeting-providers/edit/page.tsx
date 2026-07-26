import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { MeetingProviderFormContainer } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.meetingProviders;
  return { title: t.editTitle };
}

type EditPageProps = {
  readonly searchParams: Promise<{ readonly id?: string }>;
};

export default async function EditMeetingProviderPage({ searchParams }: EditPageProps) {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG], locale, context);
  const resolvedSearchParams = await searchParams;
  return <MeetingProviderFormContainer mode="edit" providerId={resolvedSearchParams.id ?? null} />;
}
