import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext, resolveProfilePageContext } from "@/backend/lib";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { ProfilePageClient } from "@/frontend/views/dashboard/profile/core/ProfilePageClient";
import { redirect } from "@/shared/i18n";

export const metadata: Metadata = {
  title: "User Profile - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  const resolution = await resolveProfilePageContext(userId, context, {
    targetUserId: id,
    mode: "view",
  });
  if ("redirect" in resolution) {
    redirect({ href: resolution.redirect, locale });
    return;
  }

  return (
    <ProfilePageClient
      scope={resolution.scope}
      mode={resolution.mode}
      audience={resolution.audience}
      targetUserId={resolution.targetUserId}
    />
  );
}
