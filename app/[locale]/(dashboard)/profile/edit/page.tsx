import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("editTitle") };
}

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

  const resolution = await resolveProfilePageContext(userId, context, { mode: ProfileMode.EDIT });
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
