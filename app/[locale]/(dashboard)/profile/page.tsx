import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ProfilePageClient } from "@/frontend/common/views/dashboard/profile/core/ProfilePageClient";
import { redirect } from "@/shared/i18n/routing";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "profile");
  return { title: t.pageTitle };
}

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;

  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  const resolution = await resolveProfilePageContext(userId, context, { mode: ProfileMode.VIEW });
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
