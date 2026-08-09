import type { Metadata } from "next";
import { headers } from "next/headers";
import { toGqlProfileAudience, toGqlProfileMode, toGqlProfileScope } from "@/app/(dashboard)/lib/profile-enum-bridge";
import { ProfileAudience as BackendProfileAudience, ProfileMode, ProfileScope } from "@/backend/enum";
import { resolveProfilePageContext } from "@/backend/lib/auth/cached-profile";
import { getCurrentUser } from "@/backend/lib/auth/cached-user";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import type {
  ProfileAudience as GqlProfileAudience,
  ProfileMode as GqlProfileMode,
  ProfileScope as GqlProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  buildTeacherProfileEditHref,
  hasForceCompleteSearchParam,
  TEACHER_PROFILE_COMPLETION_EDIT_HREF,
} from "@/frontend/common/lib/profileCompletion";
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

interface ProfileEditPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfileEditPage({ searchParams }: ProfileEditPageProps) {
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  const resolvedSearchParams = await searchParams;
  const resolution = await resolveProfilePageContext(userId, context, { mode: ProfileMode.EDIT });
  if ("redirect" in resolution) {
    redirect({ href: resolution.redirect });
    return undefined;
  }

  let nationalIdComplete: boolean | undefined;

  if (resolution.scope === ProfileScope.OWN && resolution.audience === BackendProfileAudience.TEACHER) {
    const userProfile = await getCurrentUser(userId, context);
    nationalIdComplete = userProfile.nationalIdComplete;
    const headersList = await headers();
    const searchFromHeader = headersList.get("x-search") ?? "";
    const forceComplete =
      hasForceCompleteSearchParam(resolvedSearchParams) ||
      hasForceCompleteSearchParam(new URLSearchParams(searchFromHeader.replace(/^\?/, "")));

    if (!nationalIdComplete && !forceComplete) {
      redirect({ href: TEACHER_PROFILE_COMPLETION_EDIT_HREF });
      return undefined;
    }

    if (nationalIdComplete && forceComplete) {
      redirect({ href: buildTeacherProfileEditHref(false) });
      return undefined;
    }
  }

  return (
    <ProfilePageClient
      scope={toGqlProfileScope(resolution.scope) satisfies GqlProfileScope}
      mode={toGqlProfileMode(resolution.mode) satisfies GqlProfileMode}
      audience={toGqlProfileAudience(resolution.audience) satisfies GqlProfileAudience}
      targetUserId={resolution.targetUserId}
      studentId={resolution.studentId}
      nationalIdComplete={nationalIdComplete}
    />
  );
}
