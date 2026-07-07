import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext, resolveProfilePageContext } from "@/backend/lib";
import { ProfilePageClient } from "@/frontend/views/profile/core/ProfilePageClient";
import { redirect } from "@/shared/i18n";

export const metadata: Metadata = {
  title: "Edit User Profile - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}

export default async function UserProfileEditPage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  const resolution = await resolveProfilePageContext(userId, context, {
    targetUserId: id,
    mode: "edit",
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
