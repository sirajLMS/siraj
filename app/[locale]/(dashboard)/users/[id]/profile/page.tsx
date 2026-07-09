import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  toGqlProfileAudience,
  toGqlProfileMode,
  toGqlProfileScope,
} from "@/app/[locale]/(dashboard)/lib/profile-enum-bridge";
import { ProfileMode } from "@/backend/enum";
import { resolveProfilePageContext } from "@/backend/lib/auth/cached-profile";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import type {
  ProfileMode as GqlProfileMode,
  ProfileScope as GqlProfileScope,
  ProfileAudience,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { ProfilePageClient } from "@/frontend/views/dashboard/profile/core/ProfilePageClient";
import { redirect } from "@/shared/i18n/routing";

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
    mode: ProfileMode.VIEW,
  });
  if ("redirect" in resolution) {
    redirect({ href: resolution.redirect, locale });
    return;
  }

  return (
    <ProfilePageClient
      scope={toGqlProfileScope(resolution.scope) satisfies GqlProfileScope}
      mode={toGqlProfileMode(resolution.mode) satisfies GqlProfileMode}
      audience={toGqlProfileAudience(resolution.audience) satisfies ProfileAudience}
      targetUserId={resolution.targetUserId}
    />
  );
}
