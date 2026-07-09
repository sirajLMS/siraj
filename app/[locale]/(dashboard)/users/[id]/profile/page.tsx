import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext, resolveProfilePageContext } from "@/backend/lib";
import { type ProfileAudience, ProfileMode, type ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
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
    mode: ProfileMode.View,
  });
  if ("redirect" in resolution) {
    redirect({ href: resolution.redirect, locale });
    return;
  }

  return (
    <ProfilePageClient
      scope={resolution.scope as ProfileScope}
      mode={resolution.mode as ProfileMode}
      audience={resolution.audience as ProfileAudience}
      targetUserId={resolution.targetUserId}
    />
  );
}
