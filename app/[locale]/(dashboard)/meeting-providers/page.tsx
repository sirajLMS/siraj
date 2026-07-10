import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { MeetingProvidersContainer } from "@/frontend/views/dashboard/admin/meeting-providers/MeetingProvidersContainer";

export default async function MeetingProvidersPage({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <MeetingProvidersContainer />;
}
