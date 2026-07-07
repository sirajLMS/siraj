import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { resolveProfilePageContext } from "@/backend/lib/auth/cached-profile";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { ProfilePageClient } from "@/frontend/views/profile/core/ProfilePageClient";
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
    redirect({ href: "/login", locale });
    return;
  }

  const resolution = await resolveProfilePageContext(userId, context, { mode: "edit" });
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
