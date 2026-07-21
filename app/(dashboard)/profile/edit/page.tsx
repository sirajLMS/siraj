import type { Metadata } from "next";
import { toGqlProfileAudience, toGqlProfileMode, toGqlProfileScope } from "@/app/(dashboard)/lib/profile-enum-bridge";
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
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).profileTranslations.base;
  return { title: t.editTitle };
}

export default async function ProfileEditPage() {
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }

  const resolution = await resolveProfilePageContext(userId, context, { mode: ProfileMode.EDIT });
  if ("redirect" in resolution) {
    redirect({ href: resolution.redirect });
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
