import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { resolveProfilePageContext } from "@/backend/lib/auth/cached-profile";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { type ProfileAudience, ProfileMode, type ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { ProfilePageClient } from "@/frontend/views/dashboard/profile/core/ProfilePageClient";
import { redirect } from "@/shared/i18n/routing";

export const metadata: Metadata = {
  title: "Edit Profile - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ProfileEditPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  const resolution = await resolveProfilePageContext(userId, context, { mode: ProfileMode.Edit });
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
